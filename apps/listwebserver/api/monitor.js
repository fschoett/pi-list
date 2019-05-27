const router = require('express').Router();
const { pcapIngest } = require('../util/ingest')
//const { startMonitoring, stopMonitoring, getMonitors } = require('../util/monitor/rotatingCapture');
const {startMonitoring, analyze, stopMonitoring} = require('../controllers/monitorController')
const { getMonitors} = require('../util/monitor/rotatingCapture');


router.get('/', (req,res)=>{
    var currentMonitor = getMonitors();
    res.send( currentMonitor );
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

module.exports = router;