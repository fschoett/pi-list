#!/bin/bash

cd $(dirname $0)


docker-compose stop

DUMPSERVER_PATH="server/app/dump_server/"
if [ -d $DUMPSERVER_PATH ]
then
	echo "Shutting down the tcpdump server..."
	cd $DUMPSERVER_PATH
	node stop_server.js
	echo "tcpdump server shut down!" 
fi



