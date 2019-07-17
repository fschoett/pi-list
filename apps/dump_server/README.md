# DUMP-SERVER
The dump server serves as a proxy to capture packets from the NIC with full Hardware timestamping support. It is not easily possible to capture packets from within a docker container with the same performance, so this is an easy and stable workaround

## Install
To install the dump server, simply clone the branch this file is located in. Before starting it, be sure to fill out some basic configuration:

### dump_server/config/default.json
1. Find out the IP of the docker0 interface and paste it in the default.json file
2. List the directorys the LIST tool should be able to write the packets in and give each directory a name so the paths are not disposed.
3. Optional: Change the PORT of the dump_server

### docker-compose.yml
1. Fill in the URL of the dump_server including the port like this:
	http://172.17.0.1:3000
2. Decide on which URL the LIST tool should listen.

## Start
Now simply start the app the same way as with the original application => Go to the release folder and start the app with 
	./start.sh

