// Load application server with express
const express = require('express')
const app = express()
const connection = require('./model/db')
const fileUpload = require('express-fileupload')
const userRoutes = require('./routes/users');
const userBill = require('./routes/bill');
const billFile = require('./routes/files');
const fs = require('fs')
const { Consumer } = require('sqs-consumer');
var AWS = require('aws-sdk');

const dir = '/tmp/webapp'
if(!fs.existsSync(dir)){
    fs.mkdirSync(dir)
}

const sqsQueueConsumer = Consumer.create({
    queueUrl: process.env.SQS_URL,
    handleMessage: async (message) => {
        const userEmail = message.MessageAttributes.User.StringValue
        const NumberOfDays = message.MessageAttributes.NumberOfDays.StringValue
        const userID = message.MessageAttributes.UserID.StringValue 
        connection.query("SELECT DISTINCT * FROM Bill WHERE due_date BETWEEN CURRENT_DATE() AND DATE_ADD(CURRENT_DATE(),interval ? day) AND owner_id = ?", [NumberOfDays, userID], (err, result) => {
            console.log("***************" +err);
            console.log(result)
            console.log(userID)
            var billData = []
            result.forEach(element => {billData.push({
                id : element.id,
                link : "http://"+process.env.DEVELOPMENT_TYPE+".vishakavarma.com:3000/v1/bill/"+element.id,
            })})
            var message = {
                userEmail: userEmail,
                userID: userID,
                billData: billData
            }
            console.log(JSON.stringify(message))
            var params = {
                Message: JSON.stringify(message), /* required */
                TopicArn: process.env.SNS_ARN
            };
            var publishTextPromise = new AWS.SNS({apiVersion: '2010-03-31'}).publish(params).promise();
            publishTextPromise.then(
            function(data) {
                console.log("MessageID is " + data.MessageId);
                console.log("Message is " + data.Message);
            }).catch(
                function(err) {
                console.error(err, err.stack);
            });
        })
    },
    messageAttributeNames: ['User', 'NumberOfDays', 'UserID']
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