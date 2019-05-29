const child_process = require('child_process');
const textEncoding = require('text-encoding');
const TextDecoder = textEncoding.TextDecoder;
const logger = require('../logger');
const program = require('../programArguments');
const fs = require('fs');
const path = require('path');

// Copied from ./capture/tcpdump
const getDropInfo = (stdout) => {
    const kernel_regex = /(\d+) *packets dropped by kernel/m;
    const kernel_found = stdout.match(kernel_regex);
    const kernel = kernel_found ? parseInt(kernel_found[1]) : 0;

    const interface_regex = /(\d+) *packets dropped by interface/m;
    const interface_found = stdout.match(interface_regex);
    const interface = interface_found ? parseInt(interface_found[1]) : 0;

    return { kernel, interface };
};

function checkDirectory( path ){
    fs.mkdir(path, err => { 
        if (err && err.code != 'EEXIST') throw 'up'
        {
            logger('rotating_capture').info('dir. already exists.');
        }
    });
}

// Remove all files from a directory before filling it with the new files
// Copied from https://stackoverflow.com/questions/27072866/how-to-remove-all-files-from-directory-without-removing-directory-in-node-js
function cleanDirectory(directory){

    fs.readdir(directory, (err, files) => {
        if (err) throw err;
      
        for (const file of files) {
          fs.unlink(path.join(directory, file), err => {
            if (err) throw err;
          });
        }
    });
}

// Save the current Monitor process
var currentlyMonitored = {};

// Returns a promise
function startCapturing(monitorOptions) {
    return new Promise(function (resolve, reject) {
        currentlyMonitored = {};
        const snapshotLength = monitorOptions.snapshotLengthBytes
            ? [`--snapshot-length=${monitorOptions.snapshotLengthBytes}`]
            : [];

        // tcpdump filter must be like "dst XXX.XXX.XXX.XXX or dst YYY.YYY.YYY.YYY or ..."
        const tcpdumpFilter = monitorOptions.streamEndpoints ?
        `${
            monitorOptions.streamEndpoints.map(stream => {
                var portFilter = stream.dstPort ? "port " + stream.dstPort :'';
                var addrFilter = stream.dstAddr ? "dst " + stream.dstAddr : '';
                if ( portFilter && addrFilter ){
                    return addrFilter + " and " + portFilter
                }
                else{
                    if( portFilter ) return portFilter;
                    if( addrFilter ) return addrFilter;
                }
            })
            }`.replace(/,/g, ' or ')
        : '';
        
        const tcpdumpProgram = '/usr/sbin/tcpdump';
        const tcpdumpOptions = {};

        // The filenames of the pcap capture has to be in this format for the rotating file capture to work
        // At the moment the buffer size is limited to 1 minute. To extend this buffer, change the added date format
        // Possible buffer size achived with this method are 1 Minute, 1 Hour, 1 Day, 1 Month, 1 Year
        const rotatingFileNameIntervalString = "-%S";
        var rotatingFileName = monitorOptions.path + monitorOptions.file+rotatingFileNameIntervalString+".pcap";


        checkDirectory( monitorOptions.path );
        cleanDirectory( monitorOptions.path );

        //Insert the fileNameInterval into the filename
        if( monitorOptions.file ){
            var indexOfPcap = monitorOptions.file.indexOf(".pcap");
            if ( indexOfPcap >= 0 ){
                rotatingFileName = monitorOptions.file.slice(0, indexOfPcap) 
                    + rotatingFileNameIntervalString 
                    + monitorOptions.file.slice( indexOfPcap );
            }
        }

        const tcpdumpArguments = [
            "-i", monitorOptions.interfaceName,
            "--time-stamp-precision=nano",
            "-j", "adapter_unsynced",
            ...snapshotLength,
            "-w", rotatingFileName,
            tcpdumpFilter,
            "-G 1"           
        ]


        console.log(`${tcpdumpProgram} ${tcpdumpArguments.join(' ')}`);

        const tcpDumpProcess = child_process.spawn(tcpdumpProgram,
            tcpdumpArguments,
            tcpdumpOptions
        );

        const tcpdumpOutput = [];
        const appendToOutput = (data) => {
            tcpdumpOutput.push(new TextDecoder("utf-8").decode(data));
        };

        tcpDumpProcess.on('error', (err) => {
            logger('capture').error(`error during capture:, ${err}`);
        });

        tcpDumpProcess.stdout.on('data', appendToOutput);
        tcpDumpProcess.stderr.on('data', appendToOutput);

        tcpDumpProcess.on('close', (code) => {
            logger('capture').info(`child process exited with code ${code}`);

            stopCapturing();

            const stdout = tcpdumpOutput.join('\n');

            const dropInfo = getDropInfo(stdout);

            logger('capture').info('Drop info:', dropInfo);
            logger('capture').info(stdout);

            if (code < 0) {
                const message = `tcpdump failed with code: ${code}`;
                logger('capture').error(message);
                reject(message);
                return;
            }

            if (dropInfo.kernel > 0 || dropInfo.interface > 0) {
                const message = `Dropped packets: dropInfo.kernel: ${dropInfo.kernel} | dropInfo.interface: ${dropInfo.interface}`;
                logger('capture').error(message);
                reject(message);
                return;
            }
        });



        // subscribe
        const subscribeToProgram = `${program.cpp}/subscribe_to`;
        const subscribeToOptions = {};
        const addressSubscription = [];
        
        //addressSubscription.push('-g', monitorOptions.streamEndpoints);
        //Uncommend this for multiple subscription support
        monitorOptions.streamEndpoints.forEach(s => {
            addressSubscription.push('-g', s.dstAddr);
        });

        const subscribeToArguments = [
            monitorOptions.interfaceName,
            ...addressSubscription
        ];

        logger('monitor').info(`${subscribeToProgram} ${subscribeToArguments.join(' ')}`);

        const subscribeToProcess = child_process.spawn(subscribeToProgram,
            subscribeToArguments,
            subscribeToOptions
        );

        subscribeToProcess.on('error', (err) => {
            logger('monitor').error(`error during subscription:, ${err}`);
        });

        subscribeToProcess.on('close', (code) => {
            logger('monitor').info(`subscribeTo process exited with code ${code}`);
        });

        // save the state of the monitoring process
        currentlyMonitored = {
            is_monitoring: true,
            uuid: monitorOptions.uuid, 
            tcpDumpProcess: tcpDumpProcess,
            subscribeToProcess: subscribeToProcess,
            filename: monitorOptions.file,
            streamEndpoints: monitorOptions.streamEndpoints,
            duration: monitorOptions.duration || 4
        };

        resolve();
    });
}

//just kill the processes
function stopCapturing(){
    return new Promise(function (resolve, reject) {
        if ( currentlyMonitored ){
            
            currentlyMonitored.is_monitoring = false;

            if (currentlyMonitored.tcpDumpProcess){
                currentlyMonitored.tcpDumpProcess.kill();
            }  
            if (currentlyMonitored.subscribeToProcess){
                currentlyMonitored.subscribeToProcess.kill();
            }  
            resolve();
        }
    });
}

function getMonitors(){
    var output = {
        is_monitoring : currentlyMonitored.is_monitoring,
        uuid: currentlyMonitored.uuid,
        filename: currentlyMonitored.filename,
        duration: currentlyMonitored.duration,
        streamEndpoints: currentlyMonitored.streamEndpoints
    }
    return output
}

module.exports = {
    startCapturing,
    stopCapturing,
    getMonitors
};
