#!/bin/bash
cd /home/ubuntu/webapp
sudo pkill -f node
fuser -k 3000/tcp
nodemon server.js &