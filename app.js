// Load application server with express
const express = require('express')
const app = express()
const fileUpload = require('express-fileupload')
const userRoutes = require('./routes/users');
const userBill = require('./routes/bill');
const billFile = require('./routes/files');

app.use(express.json())
app.use(fileUpload({
    tempFileDir : '/tmp/'
}));
app.use('/users', userRoutes);
app.use('/bill', userBill);
app.use('/bill', billFile);


module.exports = app;