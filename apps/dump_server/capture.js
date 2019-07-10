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

        // Check if the give directory is valid and select the corresponding 
        // host-path as the capturing directory
        var found = false;
        for( var i=0; i<captureDirs.length; i++){
            //console.log(captureDirs[i].path);
			console.log(captureDirs[i].docker);
			console.log(params.directory);
            if( captureDirs[i].docker == params.directory ) {
                this.directory = captureDirs[i].path;
                
                console.log(captureDirs[i].path);
//                this.docker_dir= captureDirs[i].docker;
		this.docker_dir=captureDirs[i].path;
                found = true;
                break
            }
        }
        if( !found) throw new Error(`Directory ${params.directory} not found or is not allowed!`);
        

        this.multicast_ip = params.multicast_ip;
        this.port = params.port;
        this.file = params.file_name || 'tmp-%S.pcap';
        this.file_name = this.file.slice( 0, this.file.indexOf('-%'));
        

        // Generate IP..
        this.id = crypto.randomBytes(16).toString("hex");
        console.log( `Generated id: ${this.id}`);

    }

    // Start the capturing and return the process information
    startCapture(){
        var clone = this.clone();
        clone.directory = this.directory;
        return startCapturing( clone );
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
            file_name: this.file_name,
            directory: this.docker_dir,
            id: this.id
        }
        return tmp;
    }
}

module.exports = Capture;
