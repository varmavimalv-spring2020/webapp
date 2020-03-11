#!/bin/bash
cd /home/ubuntu/webapp
sudo pkill -f node
fuser -k 3000/tcp
forever start server.js