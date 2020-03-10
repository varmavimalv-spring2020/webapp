#!/bin/bash
cd /home/ubuntu/webapp
sudo pkill -f node
fuser -k 3000/tcp
nohup node server.js &