// Load application server with express
const express = require('express')
const app = express()
const userRoutes = require('./routes/users');
const userBill = require('./routes/bill');

app.use(express.json())
app.use('/users', userRoutes);
app.use('/bill', userBill);

module.exports = app;