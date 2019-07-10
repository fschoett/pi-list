const config = require('config')
const fetch = require('node-fetch');
const PORT = 3000;


// Check if there is an ip set
if (config.has("docker0_iface_ip")){
	
	// if so, try to stop the server
	var ip = config.get("docker0_iface_ip");

	fetch( "http://" + ip + ":" + PORT + "/kill" )
		.then( ()=>{
			console.log("Successfully stopped the dump server.. Ciao!");
		})
		.catch( (err) => {
			console.log("An error occured trying to stop the dump server: ", err);
			if( err.code == "ECONNREFUSED" ){
				console.error("The dump server is not running on the given interface...");
			}
		});

}
else{
	console.error("There is no ip for the docker0 interface specified! Exiting..");
}



