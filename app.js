// Load application server with express
const express = require('express')
const app = express()
const fileUpload = require('express-fileupload')
const userRoutes = require('./routes/users');
const userBill = require('./routes/bill');
const billFile = require('./routes/files');
const fs = require('fs')
const { Consumer } = require('sqs-consumer');

const dir = '/tmp/webapp'
if(!fs.existsSync(dir)){
    fs.mkdirSync(dir)
}

const sqsQueueConsumer = Consumer.create({
    queueUrl: 'https://sqs.us-east-1.amazonaws.com/738768614159/TestQueue',
    handleMessage: async (message) => {
      console.log("Message Received")
      console.log(message)
    },
    messageAttributeNames: ['User', 'NumberOfDays']
});
   
sqsQueueConsumer.on('error', (err) => {
    console.error(err.message);
});
   
sqsQueueConsumer.on('processing_error', (err) => {
    console.error(err.message);
});
   
sqsQueueConsumer.start();

app.use(express.json());
app.use(fileUpload());
app.use('/v1/users', userRoutes);
app.use('/v1/bill', userBill);
app.use('/v1/bill', billFile);

module.exports = app;