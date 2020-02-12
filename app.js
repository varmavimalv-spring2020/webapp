// Load application server with express
const express = require('express')
const app = express()
const fileUpload = require('express-fileupload')
const userRoutes = require('./routes/users');
const userBill = require('./routes/bill');
const billFile = require('./routes/files');
const fs = require('fs')

const dir = '/tmp/webapp'
if(!fs.existsSync(dir)){
    fs.mkdirSync(dir)
}

app.use(express.json());
app.use(fileUpload());
app.use('/users', userRoutes);
app.use('/bill', userBill);
app.use('/bill', billFile);

module.exports = app;