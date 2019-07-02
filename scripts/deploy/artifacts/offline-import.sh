RELEASE_TAR_NAME="release.tar.gz"
IMAGE_TAR_NAME="offline_list_server.tar" 

mkdir "offline_release"

# extract tar
tar -xzvf $RELEASE_TAR_NAME -C "offline_release"

# remove tar 
rm $RELEASE_TAR_NAME

# jump into directorly
cd "offline_release"

# load the docker image
docker load -i $IMAGE_TAR_NAME

# delete docker image
rm $IMAGE_TAR_NAME

# remove docker-compose file
rm docker-compose.yml

# change name of docker-compose offline
mv docker-compose_offline.yml docker-compose.yml
