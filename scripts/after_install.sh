#!/bin/bash
sudo chown ubuntu:ubuntu /home/ubuntu/webapp
chmod 777 /home/ubuntu/webapp
cd /home/ubuntu/webapp
npm cache clean --force
sudo rm -rf node_modules
sudo rm -rf package-lock.json
cd ..
sudo mkdir webapp/var
cd ..
sudo cp /var/.env /home/ubuntu/webapp/var
cd /home/ubuntu/webapp/var/
sudo chmod 666 .env
cd ..
cd /home/ubuntu/webapp
npm install