// ============================================================================
//                           IMPORTANT NODE !!!
// ----------------------------------------------------------------------------
// For the event 'subscription' to work, the NodeAPI file has to be modified 
// before. At the moment there is an open pull request at the ledger Repo, but 
// it seems that there is no activity any more
//
// Also this method of checking for a change is only temporary, as
// for later versions of the API there will probably be other callbacks!
// ...i hope..
// ============================================================================

const ledger = require('nmos-ledger');
const fetch  = require('node-fetch');
const sdpTrans=require('sdp-transform');

// TODO: Find a way of retrieving those dynamically
const LIST_GUI_URL = "http://localhost:8080";
const MONITOR_URL =  "http://172.17.0.1:3000/";

const NODE_PORT = 3003;

const NODE_LABEL    = "LIST Node";
const NODE_URL      = "http://list.local:"+NODE_PORT;
const NODE_HOSTNAME = "list";
const NODE_TAGS     = null;
const NODE_SERVICES = [{ 
	"href": LIST_GUI_URL, 
	"type": "Capturing and Analyzing" 
}];

// Holds the record of all devices and if they are currently receiving
// example: monitor_map : {
// 		<receiver_id> : { iface : <iface> , monitor_id : <monitor_id> }
// } 
const monitor_map   = {};


// Generate the ledger Node with the given parameters
var node = new ledger.Node( 
	null, 
	null, 
	NODE_LABEL, 
	NODE_URL, 
	NODE_HOSTNAME, 
	NODE_TAGS, 
	NODE_SERVICES 
);

// Init the created Node
var store   = new ledger.NodeRAMStore( node );
var nodeAPI = new ledger.NodeAPI( NODE_PORT, store );

// Create one receiver for each interface that the host has.

var list_device = "";

initNode();

// Create the List device. 
// This should also list a service referencing to the LIST GUI
async function initNode(){
	// Add callbacks
	
	// Create callback for the topic subscription 
	// -> Is fired if  the receiver gets connected
	// .. or disconnected
	nodeAPI.on('modify', data => {
		if ( data.topic == '/subscription/' ) on_subscription( data );
	});

	// get interfaces

	var ifaces = await getIfaces();
	console.log(" Again the Iface array : ", ifaces );
	list_device = new ledger.Device( null, null, `${ifaces.toString()} LIST Device`, null, node.id);
	nodeAPI.putResource( list_device );

	// add receivers
	addReceivers( ifaces );
	nodeAPI.init().start()	
	// init node
}


async function addReceivers( ifaces ){
	console.log(" Adding receivers with theese interfaces: ", ifaces);
	for( var i=0; i<ifaces.length; i++ ){
		var tmp_receiver = new ledger.Receiver( 
			null, 
			null, 
			`LIST - Capture Port ${i} - iface ${ifaces[i]}`, 
			"", 
			null, 
			null, 
			null, 
			list_device.id, 
			null, 
			null  
		);
		
		// Add receiver to the entry
		monitor_map[ tmp_receiver.id ] = {
			monitor_id : "",
			iface: ifaces[i]
		};

		nodeAPI.putResource(tmp_receiver);
	}
	// Add Node to store
}

async function getIfaces() {
	var output = [];

	while( output.length == 0 ){
		console.log("Length of interfaces 0 => Try again");
		var res = await fetch( MONITOR_URL+'ifaces' )
		var output= await res.json();
		await timeout( 1000 );
	}
	console.log( "Output of interfaces : ", output);
	return output;
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// Callback triggered when the subscription event has been fired
// Calls the LIST api to start or stop a monitor on the respective receiver
async function on_subscription( data ){
	console.log( "Someone did a subscription Oo" );
	console.log( data.data[0].sender );
	console.log( data.data );
	if ( data.data[0].sender ){
		//Start Monitor
		console.log( "Start monitor.." );

		var SDPHref = retrieveSDPHref( data.data[0].sender ); 
		var SDPFile = await fetchSDPFile( SDPHref );
		var parsedSDP = await parseSDPFile( SDPFile );
		var multicastIP = extractMulticastIP( parsedSDP );
		var sourcePort  = extractPort( parsedSDP );
		console.log( `Multicast IP : ${multicastIP} - Port : ${sourcePort}`);
		addMonitor( data.data[0].receiver.id, multicastIP, sourcePort);
	} 
	else {
		// Stop Monitor
		console.log( "Stop monitor.." );
		removeMonitor( data.data[0].receiver.id );
	}

}


function retrieveSDPHref( sender ){
	return sender.manifest_href;
}

async function fetchSDPFile( href ){
	var res = await fetch( href );
	if ( res.ok ){
		var sdp = await res.text();
		return sdp
	}
}

async function parseSDPFile( sdp ){
	return sdpTrans.parse( sdp )
}

function extractMulticastIP ( parsedSDP ){
	console.log( parsedSDP.media[0] );
	return parsedSDP.media[0].connection.ip.split("/")[0];
}

function extractPort ( parsedSDP ){
	return  parsedSDP.media[0].port ;
}

// start a new monitoring process
// First check if there is already a monitoring process running
// If so, stopt it first before starting the new one
async function addMonitor( receiverID, multicast_ip, port ){

	// Build a map of (key: receiverID, value: monitorID)
	// Make request to the LIST server and save response to monitorID;
	var body = {
		"iface" : monitor_map[ receiverID ].iface,
		"file": "NMOS_RECORDING",
		"multicast_ip": multicast_ip,
		"port" : port,
		"from_nmos" : true
	}

	// Check if there is a capture still running
	if ( monitor_map[ receiverID ].monitor_id != "" ){
		console.log( "There is a monitor registered. Remove it first!" );
		await removeMonitor( receiverID );
	}

	try{
		var res = await fetch( MONITOR_URL+'captures' , {
				method:'POST',
				body: JSON.stringify(body),
				headers: { 'Content-Type': 'application/json' }
			});
		if( res.ok ) {
			console.log( "Successfull request to dump server" );
		}
		else {
			console.error( "something went wrong... ", res);
			return
		}
		var json = await res.json()
		monitor_map[ receiverID ].monitor_id = json.captureID;
		console.log( " Successfully posted monitor : ", json);
	}
	catch (err){
		console.error( err );
	}
}

function removeMonitor( receiverID ) {
	// Find a monitor bz its ID and stop it
	// Also remove it from the map
	console.log( "Monitor ID : ", monitor_map[ receiverID ].monitor_id );
	fetch( MONITOR_URL+'captures/'+ monitor_map[ receiverID ].monitor_id, {
			method: 'DELETE'
		})
		.then( res => { 
			if( res.ok ) {
				console.log( "Successfully stopped monior!" );
				monitor_map[ receiverID ].monitor_id = "";
			}
			else console.error( "Error trying to stop monitor!" );
		})
		.catch( err => console.error );
}
