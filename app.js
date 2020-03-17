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
app.use('/v1/users', userRoutes);
app.use('/v1/bill', userBill);
app.use('/v2/bill', userBill);
app.use('/v1/bill', billFile);

module.exports = app;