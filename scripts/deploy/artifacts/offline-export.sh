#!/bin/bash

OFFLINE_IMAGE_NAME="release_list_server"
IMAGE_TAR_NAME="offline_list_server.tar"
PATH_TO_DUMP_SERVER="server/app/dump_server/"

echo "ATTENTION! Saving the image will result in a big tar file!"
echo "Make sure that a minimum of 3Gb is left on disk!"

# Start the docker container once to build it
./start.sh
./stop.sh
cp docker-compose.yml docker-compose_offline.yml

# Commit the created container as a new image for offline usage
echo "Commit docker container as a new image..."
docker commit release_list_server_1 $OFFLINE_IMAGE_NAME

# Save the docker image of the offline_server
echo "Save the docker image..."
docker save -o $IMAGE_TAR_NAME $OFFLINE_IMAGE_NAME

# Pack the whole release directory into one single file
echo "Pack the directory..."
tar -zcvf release.tar.gz --exclude="release.tar.gz" .

echo "Removing artifacts..."
rm docker-compose_offline.yml
rm $IMAGE_TAR_NAME
