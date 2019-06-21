const child_process = require('child_process');
const fs = require('fs');
const path = require('path');

const timeout = require('../promissedTimeout.js');

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
            console.log('dir. already exists.');
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

// Returns a promise
async function startCapturing(params) {

    config = {
        snapshotLength : 20000,
        
    }
    
    const snapshotLength = config.snapshotLengthBytes
        ? [`--snapshot-length=${config.snapshotLengthBytes}`]
        : [];


    // Build filter String
    const filterPort = params.port ? `port ${params.port}` : '';
    const filterIP = params.multicast_ip ? `dst ${params.multicast_ip}` : '';
    
    var tcpdumpFilter = '';
    if ( filterPort !== '' && filterIP !== ''){
        tcpdumpFilter = `${filterPort} and ${filterIP}`; 
    }
    else{
        if(filterPort !== '') tcpdumpFilter = filterPort;
        if( filterIP  !== '') tcpdumpFilter = filterIP;
    }
    
    const tcpdumpProgram = '/usr/sbin/tcpdump';
    const tcpdumpOptions = {};

    // The filenames of the pcap capture has to be in this format for the rotating file capture to work
    // At the moment the buffer size is limited to 1 minute. To extend this buffer, change the added date format
    // Possible buffer size achived with this method are 1 Minute, 1 Hour, 1 Day, 1 Month, 1 Year
    const rotatingFileNameIntervalString = "-%S";
    
    //const pathToRamdisk = "/app/listwebserver/ramdisk/";
    
    var rotatingFileName = params.directory + params.file+rotatingFileNameIntervalString+".pcap";
    
    checkDirectory( params.directory );
    cleanDirectory( params.directory );

    //Insert the fileNameInterval into the filename
    if( params.file ){
        var indexOfPcap = params.file.indexOf(".pcap");
        if ( indexOfPcap >= 0 ){
            rotatingFileName = params.file.slice(0, indexOfPcap) 
                + rotatingFileNameIntervalString 
                + params.file.slice( indexOfPcap );
        }
    }
    
    const BUFFER_SIZE = 200000;

    const tcpdumpArguments = [
        "-i", params.iface,
        "--time-stamp-precision=nano",
        "--time-stamp-type=adapter_unsynced",
        ...snapshotLength,
        "-B", BUFFER_SIZE,
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
        tcpdumpOutput.push(data);
    };

    tcpDumpProcess.on('error', (err) => {
        console.log(`error during capture:, ${err}`);
    });

    tcpDumpProcess.stdout.on('data', appendToOutput);
    tcpDumpProcess.stderr.on('data', appendToOutput);

    tcpDumpProcess.on('close', (code) => {
        console.log(`child process exited with code ${code}`);

        stopCapturing();

        const stdout = tcpdumpOutput.join('\n');

        const dropInfo = getDropInfo(stdout);

        console.log('Drop info:', dropInfo);
        console.log(stdout);

        if (code < 0) {
            const message = `tcpdump failed with code: ${code}`;
            console.error(message);
            return Promise.reject(message);
        }

        if (dropInfo.kernel > 0 || dropInfo.interface > 0) {
            const message = `Dropped packets: dropInfo.kernel: ${dropInfo.kernel} | dropInfo.interface: ${dropInfo.interface}`;
            console.error(message);
            return Promise.reject(message);
        }
    });



    // subscribe
    const subscribeToProgram = `/home/fschoett/Documents/ebu-list-dev/pi-list/build-debug/bin/subscribe_to`;
    const subscribeToOptions = {};
    const addressSubscription = [ `-g ${params.multicast_ip}`];

    const subscribeToArguments = [
        params.iface,
        ...addressSubscription
    ];

    console.log(`${subscribeToProgram} ${subscribeToArguments.join(' ')}`);

    
    // Add an offset to the subscription to prevent any displayed packet loss!
    await timeout( 1000 );
        
    const subscribeToProcess = child_process.spawn(subscribeToProgram,
        subscribeToArguments,
        subscribeToOptions
    );

    subscribeToProcess.on('error', (err) => {
        console.error(`error during subscription:, ${err}`);
    });

    subscribeToProcess.on('close', (code) => {
        console.log(`subscribeTo process exited with code ${code}`);
    });

    console.log("Monitor Options file");

    return {
        'tcpdump':tcpDumpProcess,
        'subscribe_to' :subscribeToProcess
    }
}

//just kill the processes
async function stopCapturing( tcpdump, subscribe_to ){

    if (tcpdump){
        await tcpdump.kill();
        console.log('Killing tcpdump...');
    }  
    if (subscribe_to){
        await subscribe_to.kill();
        console.log('Killing subscribtion...');
    }
    
}

module.exports = {
    startCapturing,
    stopCapturing,
};
