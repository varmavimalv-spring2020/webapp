#!/bin/bash
sudo chown ubuntu:ubuntu /home/ubuntu/webapp
chmod 777 /home/ubuntu/webapp
cd /home/ubuntu/webapp
npm cache clean --force
sudo rm -rf node_modules
sudo rm -rf package-lock.json
sudo cp configs/cloudwatch-config.json /opt/cloudwatch-config.json
sudo cp /var/.env /home/ubuntu/webapp/
sudo chmod 666 /home/ubuntu/webapp/.env
cd /home/ubuntu/webapp
npm install
sudo npm install forever -g