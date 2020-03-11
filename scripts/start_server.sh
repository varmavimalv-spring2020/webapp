#!/bin/bash
cd /home/ubuntu/webapp
#sudo npm install forever -g
sudo pkill -f node
fuser -k 3000/tcp
#sudo --preserve-env=DB_PORT,DB_HOST,DB_USER,DB_PASSWORD,DB_NAME,S3_BUCKET printenv
#sudo --preserve-env=DB_PORT,DB_HOST,DB_USER,DB_PASSWORD,DB_NAME,S3_BUCKET forever start server.js
nodemon server.js