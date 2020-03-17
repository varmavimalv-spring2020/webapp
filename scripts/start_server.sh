#!/bin/bash
cd /home/ubuntu/webapp
sudo pkill -f node
fuser -k 3000/tcp
sudo systemctl restart cloudwatch_start
forever start server.js