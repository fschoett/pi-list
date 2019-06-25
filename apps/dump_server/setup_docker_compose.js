const {networkIfaces, captureDirs} = require('./setup_info.js');
const yaml = require('js-yaml');
const fs = require('fs');
const config = require('config');


// Load the docker-compose file and adds lines for mounting the binds 
// specified in the config file of this server
function addBindMounts(){

    // Get docker compose file
    var pathToDckrCmpsFile = "";
    if( config.has("pathToDockerCompose") ){
        pathToDckrCmpsFile = config.get("pathToDockerCompose");
    }
    var dckrCmpsFile = fs.readFileSync( pathToDckrCmpsFile,"utf8");
    var dckrCmpsFile_yml = yaml.safeLoad( dckrCmpsFile );

    // Get the list of available mounts and delete it
    var availableMounts = dckrCmpsFile_yml.services.list_server.volumes;
    availableMounts = [];

    // Add the standard dir
    availableMounts.push( 'listserver:/home/');
    
    const DST_DIR_NAME = "CaptureDir";

    // For each dir in the config file, add a new bind line in the yml file
    for( var i=0; i < captureDirs.length; i++ ){
        var src = captureDirs[i].path;
        var dst = captureDirs[i].docker;
        
        // Create the object holding the mount information
        var tmpVolume = {
            type: "bind",
            source: src,
            target: dst
        }
        
        availableMounts.push( tmpVolume );
        
        
    }
    // Change the yml file...
    dckrCmpsFile_yml.services.list_server.volumes = availableMounts;

    // ...and write it to the disk
    fs.writeFile( './tmp.yml', yaml.safeDump( dckrCmpsFile_yml ), (err) =>{
        if( err ){
            console.error(`There occured an error during the writing of the new compose file : ${err}`);
        }
        else{
            console.log("Writing new compose file was succesfull!");
        }
    });
}

module.exports = addBindMounts