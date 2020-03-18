const connection = require('../model/db')
const bcrypt = require('bcrypt')
const uuidv4 = require('uuid/v4')
const basicAuthentication = require('basic-auth')
const fs = require('fs');
const aws = require('aws-sdk')
const validateFile = require('../validations/fileValidation')
const logger = require('../winston_config')
var sdc = require('../statsd')
const s3Bucket = new aws.S3();

exports.bill_create_file = (req, res) => { 
    const start = Date.now()
    sdc.increment("counter.post.file_api")
    const authenticateUser = basicAuthentication(req)

    if (!req.files || Object.keys(req.files).length === 0) {
        logger.info("file_POST:INFO - no file attached")
        return res.status(400).send({
            "message" : "Please attach a file"
        })
    }

    else if(Object.keys(req.files).length > 1){
        logger.info("file_POST:INFO - more than 1 file attached")
        return res.status(400).send({
            "message" : "You may attach only one file at a time"
        })
    }

    const attachment = req.files[Object.keys(req.files)[0]]
    const putSingleID = req.params.id
    const filePath = '/tmp/webapp/'+req.params.id+'_'+escape(attachment.name)

    var uploadParams = {
        Bucket : process.env.S3_BUCKET,
        Key : putSingleID+"/"+attachment.name,
        Body : attachment.data
    }
    var listParams = {
        Bucket : process.env.S3_BUCKET,
        Prefix: putSingleID+"/"
    }

    validation_response = validateFile(req)
    if(validation_response.status != 200) {
        return res.status(validation_response.status).send({
            "status" : validation_response.status,
            "message" : validation_response.message
        })
    }
    //if both credentials given, check if the email exists in database, if it exists, check if the passwords match
    connection.query('SELECT * FROM UsersData where email_address = "'+authenticateUser.name+'"', (err, value) => {
        sdc.timing("timing.post.file_api.check_email", Date.now()-start)
        if(err) {
            logger.error("file_POST:Error - in checking email")
            return res.status(400).send(err)
        }
        if(value.length == 0) {
            logger.info("file_POST:INFO - no email records found")
            return res.status(400).send({
                "message" : "No such email-id exists"
            })
        }
        bcrypt.compare(authenticateUser.pass, value[0].password).then(function(match) {
            if(match) {
                connection.query('SELECT Bill.* FROM Bill INNER JOIN UsersData on Bill.owner_id = "'+value[0].id+'" AND Bill.id = "'+putSingleID+'"', (err, result) => {
                    sdc.timing("timing.post.file_api.check_bill", Date.now()-start)
                    if(err) {
                        logger.error("file_POST:Error - in checking bills")
                        return res.status(400).send(err)
                    }
                    else if(result.length == 0) {
                        logger.info("file_POST:INFO - no bill records found")
                        return res.status(404).send({
                            "message" : "No bills available for the requested ID"
                        })
                    }
                    connection.query('SELECT bill_id FROM File where bill_id = "'+putSingleID+'"', (err, ans) => {
                        sdc.timing("timing.post.file_api.get_bill_for_file", Date.now()-start)
                        var flag = false;
                        if(err) {
                            logger.error("file_POST:Error - in fetching bills")
                            return res.status(400).send(err)
                        }
                        else if(ans.length !== 0) {
                            connection.query('DELETE FROM File WHERE bill_id = "'+putSingleID+'"',(err) => {
                                sdc.timing("timing.post.file_api.delete_file_before_create", Date.now()-start)
                                if(err){
                                    flag = true;
                                    return res.status(400).send(err)
                                }
                            })
                            if(process.env.S3_BUCKET){
                                const start = Date.now()
                                s3Bucket.listObjectsV2(listParams, function(err, listResult) {
                                    sdc.timing("timing.post.file_api.delete_file_S3", Date.now()-start)
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
                                logger.info("file_POST:INFO - bill deleted from S3")
                            }
                            else{
                                const pathname = '/tmp/webapp/'
                                const regex = RegExp(putSingleID+"*", "g")
                                fs.readdirSync(pathname)
                                .filter(f => regex.test(f))
                                .map(f => fs.unlinkSync(pathname + f))
                            }   
                        }
                        if (flag) {
                            return;
                        }
                        attachment.upload_date = new Date().toISOString().slice(0,10)
                        attachment.id = uuidv4();
                        attachment.bill_id = result[0].id
                        console.log(filePath)
                        if(process.env.S3_BUCKET) {
                            const start = Date.now()
                            s3Bucket.upload(uploadParams, function(err, data) {
                                sdc.timing("timing.post.file_api.create_file_S3", Date.now()-start)
                                if(err) {
                                    return res.send(err)
                                }
                                attachment.url = data.Location
                                const sql = "INSERT INTO File (file_name, id, url, upload_date, bill_id, mimeType, size, md5, originalName,s3_metadata) VALUES (?,?,?,?,?,?,?,?,?,?)";
                                connection.query(sql, [attachment.name, attachment.id, attachment.url, attachment.upload_date, attachment.bill_id, attachment.mimetype, attachment.size, attachment.md5, attachment.name, JSON.stringify(data) ], (err, results) => {
                                    sdc.timing("timing.post.file_api.insert_file_DB", Date.now()-start)
                                    if(err) {
                                        return res.status(400).send(err)
                                    }
                                    resultDictionary = {
                                        "file_name" : attachment.name,
                                        "id" : attachment.id,
                                        "url" : attachment.url,
                                        "upload_date" : attachment.upload_date
                                    }
                                    const sql = 'UPDATE Bill set attachment = ? WHERE id = "'+putSingleID+'"'
                                    connection.query(sql, [JSON.stringify(resultDictionary)], (err, result) => {
                                        sdc.timing("timing.post.file_api.update_bill_DB", Date.now()-start)
                                        if(err){
                                            return res.status(400).send(err)
                                        }
                                        return res.status(201).send(resultDictionary)
                                    })
                                })
                                logger.info(`file_POST:INFO - file ${attachment.name} uploaded to S3`)
                            })
                        }
                        else{
                            attachment.mv(`${filePath}`, function(err) {
                                attachment.url = `${filePath}`
                                if(err) {
                                    return res.status(400).send({
                                        "message" : "Bad Request"
                                    })
                                }
                                const sql = "INSERT INTO File (file_name, id, url, upload_date, bill_id, mimeType, size, md5, originalName) VALUES (?,?,?,?,?,?,?,?,?)";
                                connection.query(sql, [attachment.name, attachment.id, attachment.url, attachment.upload_date, attachment.bill_id, attachment.mimetype, attachment.size, attachment.md5, attachment.name], (err, results) => {
                                    if(err) {
                                        return res.status(400).send(err)
                                    }
                                    resultDictionary = {
                                        "file_name" : attachment.name,
                                        "id" : attachment.id,
                                        "url" : attachment.url,
                                        "upload_date" : attachment.upload_date
                                    }
                                    const sql = 'UPDATE Bill set attachment = ? WHERE id = "'+putSingleID+'"'
                                    connection.query(sql, [JSON.stringify(resultDictionary)], (err, result) => {
                                        if(err){
                                            return res.status(400).send(err)
                                        }
                                        logger.info(`file_POST:INFO - file ${attachment.name} inserted`)
                                        return res.status(201).send(resultDictionary)
                                    })
                                })
                            })
                        }    
                    })
                })
            } else {
                logger.error(`file_POST:ERROR - invalid credentials`)
                return res.status(404).send({
                    "message" : "Invalid Password"
                })
            }
        })
    })
    sdc.timing("timing.post.file_api", Date.now()-start)
}

exports.bill_get_file = (req, res) => {
    const start = Date.now()
    sdc.increment("counter.get.file_api")
    const authenticateUser = basicAuthentication(req)
    const basicAuthCheck = req.headers.authorization
    const billID = req.params.id
    const fileID = req.params.fileid

    if(!basicAuthCheck) {
        return res.status(401).send({
            "message" : "Unauthorized Access"
        })
    }

    else if(!authenticateUser.name || !authenticateUser.pass){
        logger.error("file_GET:Error - Access without credentials")
        return res.status(400).send({
            "message" : "Please provide email and password"
        })
    }

    connection.query('SELECT * FROM UsersData where email_address = "'+authenticateUser.name+'"', (err, value) => {
        sdc.timing("timing.get.file_api.check_email", Date.now()-start)
        if(err){
            logger.error("file_GET:Error - in checking email")
            res.status(400).send(err)
        }
        else if(value.length == 0){
            logger.info("file_GET:INFO - no email records found")
            res.status(400).send({
                "message" : "No such email-id exists"
            })
        }
        else{
            bcrypt.compare(authenticateUser.pass, value[0].password).then(function(match) {
                if(match){
                    connection.query('SELECT Bill.* FROM Bill INNER JOIN UsersData on Bill.owner_id = "'+value[0].id+'" AND Bill.id = "'+billID+'"', (err, result) => {
                        sdc.timing("timing.get.file_api.check_bills", Date.now()-start)
                        if(err){
                            logger.error("file_GET:Error - in checking bills")
                            return res.status(400).send(err)
                        }
                        else if(result.length == 0){
                            logger.info("file_GET:INFO - no bill records found")
                            return res.status(404).send({
                                "message" : "No bills available for the requested ID"
                            })
                        }
                        connection.query('SELECT file_name, id, url, upload_date FROM File WHERE id = "'+fileID+'" AND bill_id = "'+billID+'"', (err, result) => {
                            if(err){
                                return res.status(400).send(err)
                            }
                            else if(result.length == 0){
                                return res.status(404).send({
                                    "message" : "No Files available for the requested ID"
                                })
                            }
                            return res.send(result[0])
                        })
                    })
                }
                else{
                    return res.status(404).send({
                        "message" : "Requested ID not found under your username."
                    })
                }
            });
        }
    })
    sdc.timing("timing.get.file_api", Date.now()-start)
}

exports.bill_delete_file = (req, res) => {
    const start = Date.now()
    sdc.increment("counter.delete.file_api")
    const authenticateUser = basicAuthentication(req)
    const fileID = req.params.fileid
    const billID = req.params.id
    const basicAuthCheck = req.headers.authorization
    var listParams = {
        Bucket : process.env.S3_BUCKET,
        Prefix: billID+"/"
    }

    if(!basicAuthCheck) {
        return res.status(401).send({
            "message" : "Unauthorized Access"
        })
    }

    //check if the user has provided both email and password
    if(!authenticateUser.name || !authenticateUser.pass){
        logger.error("file_DELETE:Error - Access without credentials")
        return res.status(400).send({
            "message" : "Please provide email and password"
        })
    }
    connection.query('SELECT * FROM UsersData where email_address = "'+authenticateUser.name+'"', (err, value) => {
        sdc.timing("timing.delete.file_api.check_email", Date.now()-start)
        if(err){
            logger.error("file_DELETE:Error - in checking email")
            res.status(400).send(err)
        }
        else if(value.length == 0){
            logger.info("file_DELETE:INFO - no email records found")
            res.status(400).send({
                "message" : "No such email-id exists"
            })
        }
        else {
            bcrypt.compare(authenticateUser.pass, value[0].password).then(function(match) { 
                if(match){
                    connection.query('SELECT Bill.id FROM Bill INNER JOIN UsersData on Bill.owner_id = "'+value[0].id+'" AND Bill.id = "'+billID+'"', (err, result) => {
                        sdc.timing("timing.delete.file_api.check_bills", Date.now()-start)
                        var flag = false;
                        if(err){
                            logger.error("file_DELETE:Error - in checking bills")
                            return res.status(400).send(err)
                        }
                        else if(result.length == 0){
                            logger.info("file_DELETE:INFO - no bill records found")
                            return res.status(404).send({
                                "message" : "No bills available for the requested ID"
                            })
                        }
                        connection.query('SELECT file_name, id, url, upload_date FROM File WHERE id = "'+fileID+'" AND bill_id = "'+billID+'"', (err, result) => {
                            sdc.timing("timing.delete.file_api.check_file", Date.now()-start)
                            if(err){
                                logger.error("file_DELETE:Error - in checking file")
                                return res.status(400).send(err)
                            }
                            else if(result.length == 0){
                                logger.info("file_DELETE:INFO - no file records found")
                                return res.status(404).send({
                                    "message" : "No Files available for the requested ID"
                                })
                            } 
                            else{
                                connection.query('DELETE FROM File WHERE id = "'+fileID+'"',(err) => {
                                    sdc.timing("timing.delete.file_api.delete_file", Date.now()-start)
                                    if(err){
                                        logger.error("file_DELETE:Error - in deleting file")
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
                                            deleteParams.Delete.Objects.push({ Key : billID });
                                            s3Bucket.deleteObjects(deleteParams, function(err, data) {
                                                if (err) {
                                                    flag = true
                                                    return res.send(err)
                                                }
                                            })
                                        } 
                                    })
                                    logger.info("file_DELETE:INFO - file deleted from S3")
                                }
                                else {
                                    const pathname = '/tmp/webapp/'
                                    const regex = RegExp(billID+"*", "g")
                                    fs.readdirSync(pathname)
                                    .filter(f => regex.test(f))
                                    .map(f => fs.unlinkSync(pathname + f))	
                                }                                
                            if(flag){
                                return;
                            }
                            connection.query('UPDATE Bill SET attachment = "'+JSON.stringify(new Object)+'" WHERE id = "'+billID+'"', (err, result) => {
                                sdc.timing("timing.delete.file_api.delete_file_from_bill", Date.now()-start)
                                logger.info("file_DELETE:INFO - file deleted from S3")
                                return res.status(204).send({
                                    "message" : "Deleted Successfully"
                                })
                            })
                        }
                        })
                                                                           
                    })
                }
                else{
                    logger.error("file_DELETE:Error - invalid credentials")
                    res.status(404).send({
                        "message" : "Please enter valid and correct credentials."
                    })
                }
            })
        }
    })
}