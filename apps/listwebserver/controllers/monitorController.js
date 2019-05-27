const fs = require('../util/filesystem');
const { generateRandomPcapDefinition } = require('../util/ingest')
const {startCapturing, stopCapturing, getMonitors} = require('../util/monitor/rotatingCapture');
const { mergeFiles } = require("../util/monitor/mergecap");
const program = require("../util/programArguments");

function startMonitoring(req, res){
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

function analyze(req,res,next){
    var currentMonitor = getMonitors();
    req.pcap = generateRandomPcapDefinition(req, currentMonitor.uuid);

    req.pcap.from_network = true; // sets this pcap as generated from network
    fs.createIfNotExists(req.pcap.folder);
  
    var mergeOptions = {
        filename: currentMonitor.filename,
        duration: req.body.duration || 5,
        outputString: currentMonitor.filename + "-mergedFile.pcap",
        filepath: "captures/"
    };
    
    // sets req.file, which is used by the ingest system
    req.file = {
        path: mergeOptions.filepath+mergeOptions.outputString,
        originalname: mergeOptions.outputString,
        filename: mergeOptions.outputString
    };
    
    mergeFiles( mergeOptions ).then(()=>{
        next();
        res.send("Finished analzying");
    }).catch(()=>{
        res.status(400);
        res.send("An error occured, trying to merge files");
    });
}


function stopMonitoring(req, res, next){
    stopCapturing().then(()=>{
        analyze(req, res, next);    
    });
}


module.exports = {
    startMonitoring,
    analyze,
    stopMonitoring
}