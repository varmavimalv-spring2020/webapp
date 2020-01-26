// Load application server with express
const express = require('express')
const app = express()
const userRoutes = require('./routes/users');

app.use(express.json())
app.use('/users', userRoutes);

module.exports = app;