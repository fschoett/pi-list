const os = require('os');
const config = require('config');

var networkIfaces = os.networkInterfaces();
var captureDirs = [];

if( config.has('captureDirectorys')){
    var dirs = config.get('captureDirectorys');
    for( var i=0; i<dirs.length; i++){
        captureDirs.push( dirs[i] );
    }
}


module.exports = {networkIfaces, captureDirs};