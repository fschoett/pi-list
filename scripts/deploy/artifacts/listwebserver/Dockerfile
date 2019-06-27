# This is the LIST server's runtime Dockerfile

FROM gcc:7.2

ENV DEBIAN_FRONTEND=noninteractive

# Install node
RUN curl -sL https://deb.nodesource.com/setup_8.x -o nodesource_setup.sh
RUN bash nodesource_setup.sh
RUN apt-get install -y \
        ffmpeg \
        nodejs \
	tcpdump \
	zip

RUN printf 'yes\n' | apt install -y wireshark-common

RUN npm install -g serve

ENV LD_LIBRARY_PATH ${LD_LIBRARY_PATH}:/usr/local/lib/

ADD app/ /app
ADD lib/ /usr/local/lib

WORKDIR /app/listwebserver/
RUN npm install

CMD serve -s /app/gui -p 8080 & npm start -- config.yml --dev
