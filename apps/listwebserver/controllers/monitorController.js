const fs = require('../util/filesystem');
const fetch = require('node-fetch')
const { generateRandomPcapDefinition } = require('../util/ingest')
const {startCapturing, stopCapturing, getMonitors} = require('../util/monitor/rotatingCapture');
const { mergeFiles } = require("../util/monitor/mergecap");
const program = require("../util/programArguments");


const TMP_SERVER_FLAG = false;

function startMonitoring(req, res){
	
            if(TMP_SERVER_FLAG){

                // get Endpoints out of the request
               var tmpEndpoints = req.body.streams ? req.body.streams.filter(f => f.dstAddr && f.dstPort) : [];

               var monitorOptions = {
                   uuid: req.body.uuid,
                   snapshotLengthBytes: "15000",
                   streamEndpoints: tmpEndpoints,
                   file: req.body.name,
                   duration: req.body.duration,
                   interfaceName: program.captureInterface,
                   path: "captures/"        
                };

                // Check if a monitoring is currently in progress
                if( getMonitors() ){
                    if( getMonitors.is_monitoring ){
                        stopCapturing().then(()=>{
                            startCapturing( monitorOptions )
                                .then( ()=>{ res.send("monitoring started") })
                                .catch( ()=> {
                                    res.status(500);
                                    res.send("An error occured during the start of the monitor");
                                });
                        });
                        return;
                    }
                }

                startCapturing( monitorOptions )
                    .then( ()=>{ res.send("monitoring started");})
                    .catch( ()=> {
                        res.status(500);
                        res.send("An error occured during the start of the monitor") 
                    });
            }
            else{
                var tmpEndpoints = req.body.streams ? req.body.streams.filter(f => f.dstAddr && f.dstPort) : [];
                if( !tmpEndpoints.length ) tmpEndpoints = [{}]

                for( var i=0; i<tmpEndpoints.length; i++){
                    fetch( program.dumpServerAddr+'/captures',{
                        method: 'POST',
                        body: JSON.stringify({
                            iface: req.body.iface.value,
                            directory: req.body.dir.value || 'captures/',
                            file: req.body.name,
                            file_name: req.body.name,
                            multicast_ip: tmpEndpoints[i].dstAddr,
                            port: tmpEndpoints[i].dstPort
                        }),
                        headers: { 'Content-Type': 'application/json' },
                    })
                    .then( fetchRes => {
                        if( fetchRes.status != 200){
                            console.log("ERROR trying to start capture");
                            res.sendStatus(fetchRes.status);
                        }
                        else return fetchRes.json();
                        
                    })
                    .then( jsonRes => {
                        console.log(jsonRes);
                        res.send(jsonRes);
                    })
                    .catch( (error)=> {
                        console.log( error);
                        res.sendStatus(500);
                    });
                }
            }
    

}

function analyze(req,res,next){
    var currentMonitor = getMonitors();

    console.log("Request Body for ananlyzing process : ",req.body);

    var captureID = req.body.captureID;
    if ( !captureID ) return res.sendStatus(400);

    // Start analyying a capturing with the given captureID
    fetch( program.dumpServerAddr+'/captures/'+captureID)
        .then( fetchRes => fetchRes.json())
        .then( resJson => {
            console.log( resJson);
            req.pcap = generateRandomPcapDefinition(req, currentMonitor.uuid);

            req.pcap.from_network = true; // sets this pcap as generated from network
            fs.createIfNotExists(req.pcap.folder);

            var mergeOptions = {
                filename: resJson.file_name,
                filepath: resJson.directory,
				outputPath: req.pcap.folder+"/",
                outputString: resJson.file_name + "-mergedFile.pcap",
                duration: req.body.duration || 5
            };


            // sets req.file, which is used by the ingest system
            req.file = {
				path: mergeOptions.outputPath+"/"+mergeOptions.outputString,
                originalname: mergeOptions.filename+"-mergedFile.pcap",
                filename: mergeOptions.outputString
            };

			console.log( req.file ) ;

            mergeFiles( mergeOptions ).then(()=>{
                next();
                res.send("Finished analzying");
            }).catch( () => {
                console.log("An error occoured");
                res.status(400);
                res.send("An error occured, trying to merge files");
            });
        });
}


function stopMonitoring(req, res, next){
    if(TMP_SERVER_FLAG){
        stopCapturing().then(()=>{
            analyze(req, res, next);    
        });
    }
    else{
        // For now: Delete all captures.. 
	var captureID = req.body.captureID;
	    fetch(program.dumpServerAddr+'/captures/'+captureID,{ method: 'DELETE' })
            .then( fetchRes => {
                if( fetchRes.ok ){
                    res.sendStatus( 200);
                    return
                }
                else{
                    res.sendStatus( fetchRes.status);
                    return
                }
            }).catch( (error) => {
                console.error("An error occured while trying to stop all capture!");
                console.error( error );
                res.status( 500 );
                res.send( error.message );
            });
    }
}


module.exports = {
    startMonitoring,
    analyze,
    stopMonitoring
}
