FROM resin/raspberrypi-node:latest

RUN sudo apt-get update && \
    sudo apt-get -y upgrade && \
    sudo apt-get install unzip

ADD https://github.com/HackerLoop/rotonde-arduino-boilerplate.js/archive/master.zip /tmp
RUN unzip /tmp/master.zip -d /usr/local/ && mv /usr/local/rotonde-arduino-boilerplate.js-master /usr/local/rotonde-arduino-boilerplate.js

WORKDIR "/usr/local/rotonde-arduino-boilerplate.js/"

RUN npm install

CMD ["/usr/local/bin/node", "index.js"]
