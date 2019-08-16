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
const timeout = require('../promissedTimeout.js');
const program = require('../programArguments');

function getCurrentSeconds(){
    var date = new Date();
    return date.getSeconds();
}


async function buildInputString( currentSeconds, duration, filename, filepath ){
    
    var output = [];

    // Prevent the collision of tcpdump writing into files. wait until it is save to read from the files
    const TIMEOUT_S = 2;

    await timeout( TIMEOUT_S * 1000 );

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

    return output;
}


async function mergeFiles( mergeOptions ){
    
    const filename = mergeOptions.filename;
    const duration = mergeOptions.duration;
    const outputString = mergeOptions.outputString;
	const outputPath = mergeOptions.outputPath;
    const filepath = mergeOptions.filepath;

    var currentSeconds = getCurrentSeconds();
    var inputString = '';
    
    if( program.ramdisk ){
        inputString = await buildInputString(currentSeconds, duration, filename, "/app/listwebserver/ramdisk/");
    }
    else{
        inputString = await buildInputString(currentSeconds, duration, filename, filepath);
    }   
    
        
    logger("mergecap").info("Files to merge: " + inputString);
    
    const mergecapArguments = ["-w",outputPath+outputString ,"-F", "pcap", ...inputString ];
    const mergecapOptions = {};
    const mergecapProgram = "/usr/bin/mergecap";
	console.log( mergecapArguments );
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

    // Promisified the closing event of the mergecap process
    try{
        await new Promise( (resolve, reject )=>{
            mergecapProcess.on("close", (code) =>{
                logger("mergecap").info("Child process exited with code "+code);
        
                const stdout = mergecapOutput.join('\n');
                logger("mergecap").info( stdout );
        
                if (code != 0) {
                    const message = `Mergecap failed with code: ${code}`;
                    logger('live').error(message);
                    reject( message );
                }
                resolve();
            });
        });
    }
    catch (error){
        return Promise.reject( error );
    }

}

module.exports = {
    mergeFiles
}
