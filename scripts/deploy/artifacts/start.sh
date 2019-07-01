#!/bin/bash

cd $(dirname $0)

# Start here the tcpdump server if it is in the same directory
# If it is not present -> Don't start it
DUMPSERVER_PATH="server/app/dump_server/"

if [ -d $DUMPSERVER_PATH ]
then
    echo "Dump server found!"
    echo "Writing binds to docker-compose.yml..."
    cd $DUMPSERVER_PATH
    node setup_docker_compose.js
    echo "Starting the server..."
    node app.js &
else
    echo "Dumper server not found. Starting without it"
fi

echo "Starting containers..."
docker-compose up --build -d

echo
echo "LIST GUI available @ http://localhost:8080"
echo
echo "Use './monitor.sh' to see logs"
echo "Use './stop.sh' to stop"
