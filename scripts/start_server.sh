#!/bin/bash
cd /home/ubuntu/webapp
nodemon server.js &
sudo pm2 -f start server.js