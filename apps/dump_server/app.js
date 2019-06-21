const express = require('express');
const bodyParser = require('body-parser')
var CaptureList = require('./capture_list.js');
const Capture = require('./capture.js');
const app = express();
const port = 3000;

var captureList = new CaptureList();

app.use( express.json() );

app.get('/', (req, res) =>{
    res.send('Hello! You want to capture something? Be my guest!');
});

// Start a capturing process, add it to a list and return its ID
app.post('/captures', (req,res) => {
    var params = req.body;
    var capture = new Capture( params );
    captureList.addCapture( capture );
    res.send({captureID: capture.id});
});

// Return a list of all capturing processes
app.get('/captures', (req,res) => {
    var allCaptures = captureList.getCaptures();
    res.send( allCaptures );
});

// Return a description of the capture with the ID captureID
app.get('/captures/:captureID', (req,res) => {
    var capture = captureList.getSingleCapture([req.params.captureID])
    res.send( JSON.stringify( capture ) );
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



app.listen(port, () => console.log(`The dump_server listens on port ${port}`));
