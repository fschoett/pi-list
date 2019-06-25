const express = require('express');
const {networkIfaces, captureDirs} = require('./setup_info.js');
var CaptureList = require('./capture_list.js');
const Capture = require('./capture.js');
const addBindMounts = require('./setup_docker_compose.js');
const app = express();
const port = 3000;

var captureList = new CaptureList();
addBindMounts();

app.use( express.json() );

app.get('/', (req, res) =>{
    res.send('Running captures: '+ captureList.getCaptures().length);
});

// Start a capturing process, add it to a list and return its ID
app.post('/captures', (req,res) => {
    var params = req.body;
    try {
        var capture = new Capture( params );
        capture.startCapture().then(
            returnObject => {
                capture.processInformation = returnObject;
                captureList.addCapture( capture );
                res.send({captureID: capture.id});
            }
        ).catch( ()=>{
            console.log("An error occured trying to start a capture");
            res.sendStatus( 400 );
        }); 

    } catch (error) {
        console.error( error.message );
        res.status(400);
        res.send(error.message);
    }
    
    
});

// Return a list of all capturing processes
app.get('/captures', (req,res) => {
    var allCaptures = captureList.getCaptures();
    res.send( allCaptures );
});

// Return a description of the capture with the ID captureID
app.get('/captures/:captureID', (req,res) => {
    var capture = captureList.getSingleCapture([req.params.captureID])
    res.send( capture);
});

// Stop a capturing process with the ID captureID 
app.delete('/captures/:captureID', (req,res) => {
    console.log(req.params.captureID);
    captureList.removeCapture( req.params.captureID );
    res.sendStatus(200);
});

// Stop all capturing processes
app.delete('/captures', (req,res) => {
    captureList.removeAllCaptures();
    res.sendStatus(200);
});

// Get a list of available network intefaces
app.get('/ifaces', (req,res) => {
    var output = [];
    for( var key in networkIfaces){
        output.push(key);
    }
    res.send( JSON.stringify( output ) );
});

// get detailed information of a specific interface
app.get('/ifaces/:iface', (req,res) => {
   if( networkIfaces[ req.params.iface ] ){
       res.send( JSON.stringify( networkIfaces[ req.params.iface ]));
   }
   else{
       res.sendStatus(404);
   }
});

// Get a list of all allowed directorys
app.get('/dirs', (req,res) =>{
    var dirNames = captureDirs.map( (dir)=>{
        return {dir_name: dir.name, dir_docker: dir.docker} ;
    });
    res.send( dirNames );
});

app.listen(port, () => console.log(`The dump_server listens on port ${port}`));