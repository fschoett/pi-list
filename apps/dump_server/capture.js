const {networkIfaces, captureDirs}  = require("./setup_info.js");
const crypto = require("crypto");

const {startCapturing, stopCapturing} = require("./monitor/rotatingCapture.js");

class Capture{
    constructor( params ){
        this.params = params;

        if( params.iface in networkIfaces ) {
            this.params.iface = params.iface;
            this.iface = params.iface;
        }
        else{
            throw new Error(`Interface ${ params.iface} does not exist!`);
        }

        var found = false;
        for( var i=0; i<captureDirs.length; i++){
            if( captureDirs[i].path == params.directory ) found = true;
        }
        
        if( found ){
            this.directory = params.directory;
        }
        else{
            throw new Error(`Directory ${params.directory} not found or is not allowed!`);
        }
        
        this.multicast_ip = params.multicast_ip;
        this.port = params.port;
        this.file = params.file_name || 'tmp-%S.pcap';
        

        // Generate IP..
        this.id = crypto.randomBytes(16).toString("hex");
        console.log( `Generated id: ${this.id}`);

    }

    // Start the capturing and return the process information
    startCapture(){
        console.log("Start Capture");
        return startCapturing( this.params );
    }

    // Stop the capturing with the help of the process information
    stopCapture(){
        console.log("Stop Capture");
        stopCapturing( 
            this.processInformation["tcpdump"], 
            this.processInformation["subscribe_to"]
        );
    }

    clone(){
        var tmp = {
            iface: this.iface,
            multicast_ip: this.multicast_ip,
            port: this.port,
            file: this.file,
            directory: this.directory,
            id: this.id
        }
        return tmp;
    }
}

module.exports = Capture;