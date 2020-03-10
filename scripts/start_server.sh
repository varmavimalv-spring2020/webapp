#!/bin/bash
cd /home/ubuntu/webapp
sudo npm install forever -g
sudo pkill -f node
fuser -k 3000/tcp
forever start server.js