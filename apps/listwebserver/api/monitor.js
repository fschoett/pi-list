const router = require('express').Router();
const fetch = require('node-fetch');
const { pcapIngest } = require('../util/ingest')
const logger = require('../util/logger');
const program = require("../util/programArguments");

//const { startMonitoring, stopMonitoring, getMonitors } = require('../util/monitor/rotatingCapture');
const {startMonitoring, analyze, stopMonitoring} = require('../controllers/monitorController')
const { getMonitors } = require('../util/monitor/rotatingCapture');


router.get('/', (req,res)=>{
    fetch(program.dumpServerAddr+"/captures", {
        method: 'GET',
        headers:{
            'Content-Type':'application/json'
        }
    })
        .then( fetchRes => fetchRes.json() )
        .then( resJson => {
            res.send( resJson );
        })
        .catch( err => {
            console.log(err);
            res.sendStatus( 500 ); 
        });
});


// Add a monitoring source and start monitoring
router.put('/start', (req,res)=>{ startMonitoring(req,res) });


// Analyze the past x seconds
router.put('/analyze', (req,res,next)=>{
        analyze(req,res,next);
    }, pcapIngest
);



// Stop the monitoring
router.put('/stop', (req,res, next)=>{
        stopMonitoring(req,res,next);
    }, pcapIngest
);

// Fetch the list of available interfaces on the host 
router.get('/ifaces', (req,res) =>{
    fetch(program.dumpServerAddr+"/ifaces")
        .then( fetchRes => fetchRes.json())
        .then( resJson => {
            logger("dump_server").info( `Succesfully fetched interface list :${resJson}` );
            res.send( resJson);
        })
        .catch( (err) =>{
            logger("dump_server").error(err);
            res.sendStatus( 500 );
        })
});

// Fetch the list of available directorys to capture to
router.get('/dirs', (req,res) =>{
    fetch( program.dumpServerAddr+"/dirs")
        .then( fetchRes => fetchRes.json())
        .then( resJson => {
            logger("dump_server").info( `Succesfully fetched dir list :${resJson}` );
            res.send( resJson );
        })
        .catch( (err) =>{
            logger("dump_server").error(err);
            res.sendStatus( 500 );
        })
});

module.exports = router;
