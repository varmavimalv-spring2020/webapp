const connection = require('../model/db')
const bcrypt = require('bcrypt')
const validate = require('../validations/billValidation')
const uuidv4 = require('uuid/v4')
const basicAuthentication = require('basic-auth')
const fs = require('fs');
const aws = require('aws-sdk')
const logger = require('../winston_config')
var sdc = require('../statsd')
const s3Bucket = new aws.S3();

exports.users_create_bill = (req, res) => {
    const start = Date.now()
    sdc.increment("counter.post.bill_api")
    const data = req.body
    const authenticateUser = basicAuthentication(req)
    const basicAuthCheck = req.headers.authorization

    //basic auth provides default naming convention as name and pass for email and password
    //check if the user has provided both email and password
    if(!basicAuthCheck) {
        return res.status(401).send({
            "message" : "Unauthorized Access"
        })
    }

    if(!authenticateUser.name || !authenticateUser.pass){
        logger.error("bill_POST:Error - Access without credentials")
        return res.status(400).send({
            "message" : "Please provide email and password"
        })
    }

    //if both credentials given, check if the email exists in database, if it exists, check if the passwords match
    else{
        connection.query('SELECT * FROM UsersData where email_address = "'+authenticateUser.name+'"', (err, value) => {
            sdc.timing("timing.post.bill_api.check_email", Date.now()-start)
            if(err){
                logger.error("bill_POST:Error - in checking email")
                res.status(400).send(err)
            }
            else if(value.length == 0){
                logger.info("bill_POST:INFO - no email records found")
                res.status(400).send({
                    "message" : "No such email-id exists"
                })
            }
            else{
                if(bcrypt.compare(authenticateUser.pass, value[0].password).then(function(match) {
                    if(match){
                        validation_response = validate(req)
                        if(validation_response.status != 200){
                            res.status(validation_response.status).send({
                                "status" : validation_response.status,
                                "message" : validation_response.message
                            })
                        }
                        else{
                            data.id = uuidv4();
                            data.created_ts = new Date();
                            data.updated_ts = new Date();
                            data.owner_id = value[0].id;
                            data.attachment = new Object()
                            categories = data.categories.join('|')
                            const sql = "INSERT INTO Bill (id, created_ts, updated_ts, owner_id, vendor, bill_date, due_date, amount_due, categories, paymentStatus, attachment) VALUES (?,?,?,?,?,?,?,?,?,?,?)";
                            const query = connection.query(sql, [data.id, data.created_ts, data.updated_ts,
                                data.owner_id, data.vendor, data.bill_date, data.due_date, data.amount_due, categories, data.paymentStatus, JSON.stringify(data.attachment)],(err, results) => {
                                sdc.timing("timing.post.bill_api.data_insert", Date.now()-start)
                                if(err) {
                                    logger.error("bill_POST:Error - in creating bill")
                                    return res.status(400).send(err)
                                }
                                logger.info(`bill_POST:INFO - bill attached to ${authenticateUser.name}'s record`)
                                return res.status(201).send(data)
                            });
                        }
                    }
                    else{
                        logger.error("bill_POST:Error - invalid password")
                        res.status(401).send({
                            "message" : "Invalid Password"
                        })
                    }
                }));
            }
        })
    }
    sdc.timing("timing.post.bill_api", Date.now()-start)
}

exports.users_get_bills =  (req, res) => {
    const start = Date.now()
    sdc.increment("counter.get.bill_api")
    const authenticateUser = basicAuthentication(req)
    const basicAuthCheck = req.headers.authorization

    if(!basicAuthCheck) {
        return res.status(401).send({
            "message" : "Unauthorized Access"
        })
    }

    //check if the user has provided both email and password
    if(!authenticateUser.name || !authenticateUser.pass){
        logger.error("bill_GET:Error - Access without credentials")
        return res.status(400).send({
            "message" : "Please provide email and password"
        })
    }

    //if both credentials given, check if the email exists in database, if it exists, check if the passwords match
    else{
        connection.query('SELECT * FROM UsersData where email_address = "'+authenticateUser.name+'"', (err, value) => {
            sdc.timing("timing.get.bill_api.check_email", Date.now()-start)
            if(err){
                logger.error("bill_GET:Error - in checking email")
                res.status(400).send(err)
            }
            else if(value.length == 0){
                logger.info("bill_GET:INFO - no email records found")
                res.status(400).send({
                    "message" : "No such email-id exists"
                })
            }
            else{
                if(bcrypt.compare(authenticateUser.pass, value[0].password).then(function(match) {
                    if(match){
                        connection.query('SELECT DISTINCT Bill.* FROM Bill INNER JOIN UsersData on Bill.owner_id = ?', value[0].id, (err, result) => {
                            sdc.timing("timing.get.bill_api.check_bills", Date.now()-start)
                            if(err){
                                logger.error("bill_GET:Error - in checking bill")
                                res.status(400).send(err)
                            }
                            else{
                                if(result.length == 0){
                                    logger.info("bill_GET:INFO - no bill records found")
                                    res.status(404).send({
                                        "message" : "No bills available"
                                    })
                                }
                                else{
                                for (i = 0; i < result.length; i++) {
                                    result[i].categories = result[i].categories.split('|')
                                    result[i].attachment = JSON.parse(result[i].attachment)
                                    }
                                logger.info(`bill_GET:INFO - bill records for ${authenticateUser.name} returned successfully`)
                                return res.send(result)
                                }
                            }
                        })
                    }
                    else{
                        logger.error("bill_GET:Error - invalid credentials entered")
                        return res.status(400).send({
                            "message" : "Please enter valid and correct credentials."
                        })
                    }
                }));
            }
        });
    }
    sdc.timing("timing.get.bill_api", Date.now()-start)
}

exports.users_get_bills_id = (req, res) => {
    const start = Date.now()
    sdc.increment("counter.get.bill_id_api")
    const authenticateUser = basicAuthentication(req)
    const getSingleId = req.params.id
    const basicAuthCheck = req.headers.authorization

    if(!basicAuthCheck) {
        return res.status(401).send({
            "message" : "Unauthorized Access"
        })
    }

    //check if the user has provided both email and password
    if(!authenticateUser.name || !authenticateUser.pass){
        logger.error("bill_GET_ID:Error - Access without credentials")
        return res.status(400).send({
            "message" : "Please provide email and password"
        })
    }

    //if both credentials given, check if the email exists in database, if it exists, check if the passwords match
    else{
        connection.query('SELECT * FROM UsersData where email_address = "'+authenticateUser.name+'"', (err, value) => {
            sdc.timing("timing.get_id.bill_api.check_email", Date.now()-start)
            if(err){
                logger.error("bill_GET_ID:Error - in checking email")
                res.status(400).send(err)
            }
            else if(value.length == 0){
                logger.info("bill_GET_ID:INFO - no email records found")
                res.status(400).send({
                    "message" : "No such email-id exists"
                })
            }
            else{
                if(bcrypt.compare(authenticateUser.pass, value[0].password).then(function(match) {
                    if(match){
                        connection.query('SELECT Bill.* FROM Bill INNER JOIN UsersData on Bill.owner_id = "'+value[0].id+'" AND Bill.id = "'+getSingleId+'"', (err, result) => {
                            sdc.timing("timing.get.bill_id_api.check_bills", Date.now()-start)
                            if(err){
                                logger.error("bill_GET_ID:Error - in checking bill")
                                res.status(400).send(err)
                            }
                            else if(result.length == 0){
                                logger.info("bill_GET_ID:INFO - no bill records found")
                                res.status(404).send({
                                    "message" : "No bills available for the requested ID"
                                })
                            }
                            else{
                                result[0].categories = result[0].categories.split('|')
                                result[0].attachment = JSON.parse(result[0].attachment)
                                logger.info(`bill_GET:INFO - bill records for ${result[0].id} for user ${authenticateUser.name} returned successfully`)
                                return res.send(result[0])
                            }
                        })
                    }
                    else{
                        logger.error("bill_GET_ID:Error - invalid ID entered")
                        return res.status(404).send({
                            "message" : "Requested ID not found under your username."
                        })
                    }
                }));
            }
        });
    }
    sdc.timing("timing.get_id.bill_api", Date.now()-start)
}

exports.users_update_bills_id = (req, res) => {
    const start = Date.now()
    sdc.increment("counter.put.bill_api")
    const data = req.body
    const authenticateUser = basicAuthentication(req)
    const putSingleID = req.params.id
    const basicAuthCheck = req.headers.authorization

    if(!basicAuthCheck) {
        return res.status(401).send({
            "message" : "Unauthorized Access"
        })
    }

    //check if the user has provided both email and password
    if(!authenticateUser.name || !authenticateUser.pass){
        logger.error("bill_PUT:Error - Access without credentials")
        return res.status(400).send({
            "message" : "Please provide email and password"
        })
    }

    //if both credentials given, check if the email exists in database, if it exists, check if the passwords match
    else{
        connection.query('SELECT * FROM UsersData where email_address = "'+authenticateUser.name+'"', (err, value) => {
            sdc.timing("timing.put.bill_api.check_email", Date.now()-start)
            if(err){
                logger.error("bill_PUT:Error - in checking email")
                res.status(400).send(err)
            }
            else if(value.length == 0){
                logger.info("bill_PUT:INFO - no email records found")
                res.status(400).send({
                    "message" : "No such email-id exists"
                })
            }
            else{
                if(bcrypt.compare(authenticateUser.pass, value[0].password).then(function(match) {
                    if(match){
                        connection.query('SELECT Bill.* FROM Bill INNER JOIN UsersData on Bill.owner_id = "'+value[0].id+'" AND Bill.id = "'+putSingleID+'"', (err, result) => {
                            sdc.timing("timing.put.bill_api.check_bills", Date.now()-start)
                            if(err){
                                logger.error("bill_PUT:Error - in checking bill")
                                res.status(400).send(err)
                            }
                            else if(result.length == 0){
                                logger.info("bill_PUT:INFO - no bill records found")
                                res.status(404).send({
                                    "message" : "No bills available for the requested ID"
                                })
                            }
                            else{
                                validation_response = validate(req)
                                if(validation_response.status != 200){
                                    res.status(validation_response.status).send({
                                        "status" : validation_response.status,
                                        "message" : validation_response.message
                                    })
                                }
                                else{
                                    data.updated_ts = new Date();
                                    data.created_ts = result[0].created_ts
                                    data.owner_id = result[0].owner_id
                                    data.id = result[0].id
                                    data.attachment = JSON.parse(result[0].attachment)
                                    categories = data.categories.join('|')
                                    const sql = 'UPDATE Bill SET vendor = ?, bill_date = ?, due_date = ?, amount_due = ?, categories = ?, updated_ts = ?, paymentStatus = ? WHERE id = "'+putSingleID+'"'
                                    connection.query(sql, [data.vendor, data.bill_date, data.due_date, data.amount_due, categories, data.updated_ts, data.paymentStatus], (err,results) => {
                                        sdc.timing("timing.put.bill_api.update_bill", Date.now()-start)
                                        if(err){
                                            logger.error("bill_PUT:Error - in updating bill")
                                            return res.status(400).send(err)
                                        }
                                        logger.info(`bill_GET:INFO - bill records for ${data.id} for user ${authenticateUser.name} returned successfully`)
                                        return res.status(200).send(data)
                                    })
                                }
                            }
                        })
                    }
                    else{
                        logger.error("bill_PUT:Error - invalid credentials")
                        res.status(404).send({
                            "message" : "Please enter valid and correct credentials."
                        })
                    }
                }));
            }
        })
    }
    sdc.timing("timing.put.bill_api", Date.now()-start)
}
                    
exports.delete_bill_id = (req, res) => {
    const start = Date.now()
    sdc.increment("counter.delete.bill_api")
    const authenticateUser = basicAuthentication(req)
    const deleteSingleId = req.params.id
    const basicAuthCheck = req.headers.authorization
    var listParams = {
        Bucket : process.env.S3_BUCKET,
        Prefix: deleteSingleId+"/"
    }

    if(!basicAuthCheck) {
        return res.status(401).send({
            "message" : "Unauthorized Access"
        })
    }

    //check if the user has provided both email and password
    if(!authenticateUser.name || !authenticateUser.pass){
        logger.error("bill_DELETE:Error - Access without credentials")
        return res.status(400).send({
            "message" : "Please provide email and password"
        })
    }

    //if both credentials given, check if the email exists in database, if it exists, check if the passwords match
    else{
        connection.query('SELECT * FROM UsersData where email_address = "'+authenticateUser.name+'"', (err, value) => {
            sdc.timing("timing.delete.bill_api.check_email", Date.now()-start)
            if(err){
                logger.error("bill_DELETE:Error - in checking email")
                res.status(400).send(err)
            }
            else if(value.length == 0){
                logger.info("bill_DELETE:INFO - no email records found")
                res.status(400).send({
                    "message" : "No such email-id exists"
                })
            }
            else{
                if(bcrypt.compare(authenticateUser.pass, value[0].password).then(function(match) {
                    if(match){
                        connection.query('SELECT Bill.id, Bill.attachment FROM Bill INNER JOIN UsersData on Bill.owner_id = "'+value[0].id+'" AND Bill.id = "'+deleteSingleId+'"', (err, result) => {
                            sdc.timing("timing.delete.bill_api.check_bills", Date.now()-start)
                            var flag = false;
                            billAttachment = (result[0].attachment).length
                            if(err){
                                logger.error("bill_DELETE:Error - in checking bills")
                                res.status(400).send(err)
                            }
                            else if(result.length == 0){
                                logger.info("bill_DELETE:INFO - no bill records found")
                                res.status(404).send({
                                    "message" : "No bills available for the requested ID"
                                })
                            }
                            else if(billAttachment !== 0){
                                connection.query('DELETE FROM File WHERE bill_id = "'+deleteSingleId+'"',(err) => {
                                    sdc.timing("timing.delete.bill_api.delete_file_before_update", Date.now()-start)
                                    if(err){
                                        logger.error("bill_DELETE:Error - in deleting file")
                                        flag = true;
                                        return res.status(400).send(err)
                                    }
                                }) 
                                if(process.env.S3_BUCKET) {
                                    const start = Date.now()
                                    s3Bucket.listObjectsV2(listParams, function(err, listResult) {
                                        sdc.timing("timing.delete.bill_api.delete_file_S3", Date.now()-start)
                                        if (err) {
                                            return res.send(err) 
                                        }
                                        else {
                                            if (listResult.Contents.length === 0) return;
                                            const deleteParams = {
                                                Bucket: process.env.S3_BUCKET,
                                                Delete: { Objects: [] }
                                            };
                                            listResult.Contents.forEach(({ Key }) => {
                                                deleteParams.Delete.Objects.push({ Key });
                                            });
                                            s3Bucket.deleteObjects(deleteParams, function(err, data) {
                                                if (err) {
                                                    flag = true
                                                    return res.send(err)
                                                }
                                            })
                                        } 
                                    })
                                    logger.info("bill_DELETE:INFO - file deleted from S3")
                                }                         
                                else{
                                    const pathname = '/tmp/webapp/'
                                    const regex = RegExp(deleteSingleId+"*", "g")
                                    fs.readdirSync(pathname)
                                    .filter(f => regex.test(f))
                                    .map(f => fs.unlinkSync(pathname + f))	
                                }

                            if(flag){
                                return;
                            }
                            connection.query('DELETE FROM Bill WHERE id = "'+deleteSingleId+'"', (err, result) => {
                                sdc.timing("timing.delete.bill_api.delete_bill", Date.now()-start)
                                logger.info(`bill_DELETE:INFO - Bill ${deleteSingleId} deleted successfully`)
                                return res.status(204).send({
                                    "message" : "Deleted Successfully"
                                })
                            })
                            }
                            else{
                                const sql = 'DELETE FROM Bill WHERE id = "'+deleteSingleId+'"'
                                connection.query(sql, (err, result) => {
                                    sdc.timing("timing.delete.bill_api.delete_bill", Date.now()-start)
                                    if(err){
                                        logger.error("bill_DELETE:Error - in deleting bill")
                                        return res.status(400).send(err)
                                    }
                                    logger.info(`bill_DELETE:INFO - Bill ${deleteSingleId} deleted successfully`)
                                    return res.status(204).send({
                                        "message" : "Deleted Successfully"
                                    })
                                })
                            }
                        })
                    }
                    else{
                        logger.error("bill_DELETE:Error - invalid credentials")
                        res.status(404).send({
                            "message" : "Please enter valid and correct credentials."
                        })
                    }
                }));
            }
        })
    }
    sdc.timing("timing.delete.bill_api", Date.now()-start)
}

exports.users_get_bills_due = (req, res) => {
    const start = Date.now()
    sdc.increment("counter.get.bill_due_api")
    const authenticateUser = basicAuthentication(req)
    const billId = req.params.id
    const basicAuthCheck = req.headers.authorization
    const numberOfDays = req.params.x
    aws.config.update({region: process.env.SQS_REGION});
    var sqs = new aws.SQS({apiVersion: '2012-11-05'});

    if(!basicAuthCheck) {
        return res.status(401).send({
            "message" : "Unauthorized Access"
        })
    }

    //check if the user has provided both email and password
    if(!authenticateUser.name || !authenticateUser.pass){
        logger.error("bill_GET_ID:Error - Access without credentials")
        return res.status(400).send({
            "message" : "Please provide email and password"
        })
    }

    else {
        connection.query('SELECT * FROM UsersData where email_address = "'+authenticateUser.name+'"', (err, value) => {
            sdc.timing("timing.get_id.bill_api.check_email", Date.now()-start)
            if(err){
                logger.error("bill_GET_ID:Error - in checking email")
                res.status(400).send(err)
            }
            else if(value.length == 0){
                logger.info("bill_GET_ID:INFO - no email records found")
                res.status(400).send({
                    "message" : "No such email-id exists"
                })
            }
            else {
                if(bcrypt.compare(authenticateUser.pass, value[0].password).then(function(match) {
                    if(match) {
                        var params = {
                            DelaySeconds: 10,
                            MessageAttributes: {
                                "User": {
                                    DataType: "String",
                                    StringValue: authenticateUser.name
                                },
                                "NumberOfDays": {
                                    DataType: "Number",
                                    StringValue: `${numberOfDays}`
                                },
                                "UserID": {
                                    DataType: "String",
                                    StringValue: value[0].id
                                }
                            },
                            MessageBody: "Test",
                            QueueUrl: process.env.SQS_URL
                        };
                        sqs.sendMessage(params, function(err, data) {
                            if (err) {
                                return res.status(400).send(err)
                            } 
                        });
                        return res.status(200).send({"message" : "Success"})
                    }
                    else {
                        return res.status(404).send({"message" : "Not found"})
                    }
                }));
            }
        })
    }
}