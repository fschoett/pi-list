/* Find the right files to merge:
    - Get the current seconds
    - Get the filename
    - Get the duration in seconds that should be analyzed
    - Build path and filename 
    - Merge filenames to a single string
*/
const child_process = require('child_process');
const logger = require('../logger');
const textEncoding = require('text-encoding');
const TextDecoder = textEncoding.TextDecoder;


function getCurrentSeconds(){
    var date = new Date();
    return date.getSeconds();
}


function buildInputString( currentSeconds, duration, filename, filepath ){
    return new Promise( function (resolve, reject){
        
        var output = [];
    
        // Prevent the collision of tcpdump writing into files. wait until it is save to read from the files
        const TIMEOUT_S = 2;
    
        console.log("START WAITING 2s ...");
    
        setTimeout(()=>{
            for( var i=0; i<duration; i++){
        
                var seconds = currentSeconds-i;
                if(seconds < 0){
                    seconds = 60+seconds;
                }
                
                var secondsString = "";
                if(seconds / 10 < 1) secondsString = "0"+seconds;
                else secondsString = seconds;
                
                output.push(`${filepath}${filename}-${secondsString}.pcap`);
            }
            console.log("...STOP WAITING 2s!");
            resolve(output);
        },TIMEOUT_S*1000);
    });
}


function mergeFiles( mergeOptions ){
    return new Promise(function (resolve, reject){
        const filename = mergeOptions.filename;
        const duration = mergeOptions.duration;
        const outputString = mergeOptions.outputString;
        const filepath = mergeOptions.filepath;
    
        var currentSeconds = getCurrentSeconds();
    
        return buildInputString(currentSeconds, duration, filename, filepath).then( str => {
            const inputString = str;
            logger("mergecap").info("Files to merge: " + str);
            
            const mergecapArguments = ["-w", filepath+outputString,"-F", "pcap", ...inputString ];
            const mergecapOptions = {};
            const mergecapProgram = "/usr/bin/mergecap";
        
            const mergecapProcess = child_process.spawn(
                mergecapProgram,
                mergecapArguments,
                mergecapOptions
            )
            
            const mergecapOutput = [];
            const appendToOutput = ( data ) =>{
                mergecapOutput.push( new TextDecoder("utf-8").decode(data));
            };
        
            mergecapProcess.stderr.on("data", appendToOutput);
            mergecapProcess.stdout.on("data", appendToOutput);
        
            mergecapProcess.on("close", (code) =>{
                logger("mergecap").info("Child process exited with code "+code);
        
                const stdout = mergecapOutput.join('\n');
                logger("mergecap").info( stdout );
        
                if (code != 0) {
                    const message = `Mergecap failed with code: ${code}`;
                    logger('live').error(message);
                    reject(message);
                    return;
                }
    
                resolve();
            });

        });
    

    });
}

module.exports = {
    mergeFiles
}