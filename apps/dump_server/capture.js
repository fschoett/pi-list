const crypto = require("crypto");

class Capture{
    constructor( params ){
        this.iface = params.iface;
        this.multicast_ip = params.multicast_ip;
        this.port = params.port;
        this.file = params.file_name || 'tmp-%S.pcap';
        this.directory = params.directory;

        // Generate IP..
        this.id = crypto.randomBytes(16).toString("hex");
        console.log( `Generated id: ${this.id}`);

        // Start the capturing
        this.processInformation = this.startCapture()
    }

    // Start the capturing and return the process information
    startCapture(){
        console.log("Start Capture");
    }

    // Stop the capturing with the help of the process information
    stopCapture(){
        console.log("Stop Capture");
    }
}

module.exports = Capture;