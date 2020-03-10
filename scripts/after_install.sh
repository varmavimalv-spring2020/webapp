#!/bin/bash
sudo chown ubuntu:ubuntu /home/ubuntu/webapp
chmod 777 /home/ubuntu/webapp
cd /home/ubuntu/webapp
npm cache clean --force
sudo rm -rf node_modules
sudo rm -rf package-lock.json
npm install