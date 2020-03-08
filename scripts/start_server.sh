#!/bin/bash
sudo -i
cd /home/ubuntu/webapp
sudo pkill -f node
nodemon server.js