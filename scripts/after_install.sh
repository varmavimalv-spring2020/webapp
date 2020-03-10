#!/bin/bash
sudo chmod 666 /home/ubuntu/webapp
cd /home/ubuntu/webapp
npm cache clean --force
rm -rf node_modules
rm -rf package-lock.json
npm install