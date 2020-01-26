const http = require('http');
const port = process.env.PORT || 3000;
const app = require('./app');
const env = require('dotenv').config()
const server = http.createServer(app);

server.listen(port, () =>{
    console.log("Running")
});