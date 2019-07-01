const os = require('os');
const config = require('config');

const DOCKER_DIR_NAME = "/app/listwebserver/CaptureDir";
//const DOCKER_DIR_NAME = "CaptureDir";
var networkIfaces = os.networkInterfaces();
var captureDirs = [];

if( config.has('captureDirectorys')){
    var dirs = config.get('captureDirectorys');
    for( var i=0; i<dirs.length; i++){
        var counter = "";
        
        // e.g. CAPTURE_DIR03
        i < 10 ? counter="0"+i : counter=""+i
        
        var clone = {
            path: dirs[i].path,
            name: dirs[i].name,
            type: dirs[i].type,
            docker:DOCKER_DIR_NAME + counter + '/',
        }
        
        captureDirs.push( clone );
    }
}


module.exports = {networkIfaces, captureDirs};