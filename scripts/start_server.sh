#!/bin/bash
cd /home/ubuntu/webapp
sudo pkill -f node
nodemon server.js