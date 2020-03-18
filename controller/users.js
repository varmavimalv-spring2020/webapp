const connection = require('../model/db')
const joi = require('joi')
const fs = require('fs')
const bcrypt = require('bcrypt')
const uuidv4 = require('uuid/v4')
const basicAuthentication = require('basic-auth')
const saltRounds = 10
const logger = require('../winston_config')
var sdc = require('../statsd')

exports.users_get_user_self = (req, res) => {
    const start = Date.now()
    sdc.increment('counter.get.user_api');
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
        logger.error('user_GET:Error - Access without credentials')
        return res.status(400).send({
            "message" : "Please provide email and password"
        })
    }

    //if both credentials given, check if the email exists in database, if it exists, check if the passwords match
    else{
        connection.query('SELECT * FROM UsersData where email_address = "'+authenticateUser.name+'"', (err, value) => {
            sdc.timing('timing.get.user_api.fetch_email', Date.now()-start)
            if(err){
                logger.error('user_GET:Error - Requested email not found')
                res.status(400).send(err)
            }
            else if(value.length == 0){
                logger.info("user_GET:INFO - no email records found")
                res.status(400).send({
                    "message" : "No such email-id exists"
                })
            }
            else{
                if(bcrypt.compare(authenticateUser.pass, value[0].password).then(function(match) {
                    if(match){
                        connection.query('SELECT id, first_name, last_name, email_address, account_created, account_updated FROM UsersData where email_address = ?', authenticateUser.name, (err, result) => {
                            sdc.timing('timing.get.user_api.get_records', Date.now()-start)
                            if(err){
                                logger.error('user_GET:Error - cannot fetch user records')
                                res.status(400).send(err)
                            }
                            else{
                                //Parse object to json
                                logger.info(`user_GET:INFO - ${result[0].email_address} data returned successfully`)
                                const resultJson = result[0];
                                res.send(resultJson)
                            }
                        });
                    }
                    else{
                        logger.error('user_GET:Error - invalid password entered')
                        res.status(401).send({
                            "message" : "Invalid Password"
                        })
                    }
                    
                }));
           
            }
        });
    }
    sdc.timing("timing.get.user_api", Date.now()-start)
}

exports.users_create = (req, res) => {
    const start = Date.now()
    sdc.increment("counter.post.user_api")
    //invalid_passwords.txt has the top 100000 most common passwords
    //The text file is provided by NIST at https://cry.github.io/nbp/
    //NIST Bad Passwords (NBP) comes with password lists sourced from SecLists by Daniel Miessler.
    const invalid_passwords = fs.readFileSync('invalid_passwords.txt').toString().split("\n")
    const data = req.body
    const emailAddress = data.email_address
    const schema = joi.object().keys({
        email_address : joi.string().email(),
        password : joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/).invalid(invalid_passwords),
        first_name : joi.string().min(2).max(50).required(),
        last_name : joi.string().min(2).max(50).required(),
    });
    if(Object.keys(data).length == 0){
        res.status(400).send({
            "status":"400",
            "message":"Please enter valid data for the user"
        })
    }

    else if(!data.first_name || !data.last_name ||!data.password ||!data.email_address){
        res.status(400).send({
            "message":"Please enter first and last names, password and email address"
        })
    }

    else if(data.password && (JSON.stringify(data.password).length<8)){
        //const convertPasswordToString = JSON.stringify(data.password)
            res.status(400).send({
                "status":"400",
                "message":"Password must be greater than 8 characters"
            })
    }

    else if(data.account_created || data.account_updated || data.id){
        res.status(401).send({
            "message":"User cannot id, update account_created and account_updated"
        })
    }

    else{
        connection.query('SELECT COUNT(*) AS count FROM UsersData where email_address = "'+emailAddress+'"', (err, value) => {
            sdc.timing('timing.post.user_api.check_email', Date.now()-start)
            if(err){
                logger.error("user_POST:Error - in checking email")
                res.status(400).send(err)
            }
            else{
                if(value[0].count > 0){
                    logger.info("user_POST:INFO - email already exists")
                    res.status(400).send({
                        "status":"400",
                        "message":"Email already exists"
                    })
                }
                else{
                    joi.validate(req.body, schema, (err, value) => {
                        if(err){
                            logger.error('user_POST:Error - in password logging')
                            res.status(400).send({
                                "message":"Bad Request",
                                "description":"Please enter a valid email and password. The Password must contain atleast one uppercase letter, one lowercase letter, one number and one special character."
                            })
                        }
                        else{
                            data.id = uuidv4();
                            data.account_created = new Date();
                            data.account_updated = new Date();
                            //Hash the password before inserting into the database with BCrypt using 10 Salt rounds
                            bcrypt.hash(data.password, saltRounds).then(function(hash) {
                            const sql = "INSERT INTO UsersData (id, email_address, password, first_name, last_name, account_created, account_updated) VALUES (?,?,?,?,?,?,?)";
                            const query = connection.query(sql, [data.id, data.email_address, hash,
                                data.first_name, data.last_name, data.account_created, data.account_updated],(err, results) => {
                                sdc.timing('timing.post.user_api.data_insert', Date.now()-start)
                                if(err) {
                                    logger.error('user_POST:Error - in inserting data')
                                    throw err;
                                }
                            delete data.password;
                            logger.info(`user_POST:INFO - user with email ${data.email_address} created`)
                            return res.status(201).send(data)   
                            });
                        })
                        }
                    });
                } 
            }
        }); 
    }
    sdc.timing("timing.post.user_api", Date.now()-start)
}

exports.users_update = (req, res) => {
    const start = Date.now()
    sdc.increment("counter.put.user_api")
    const invalid_passwords = fs.readFileSync('invalid_passwords.txt').toString().split("\n")
    const data = req.body
    const schemaPassword = joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/).invalid(invalid_passwords)
    const convertPasswordToString = JSON.stringify(data.password)
    const authenticateUser = basicAuthentication(req)
    const basicAuthCheck = req.headers.authorization

    if(!basicAuthCheck) {
        return res.status(401).send({
            "message" : "Unauthorized Access"
        })
    }

    if(!authenticateUser.name || !authenticateUser.pass){
        logger.error('user_PUT:Error - Access without credentials')
        return res.status(400).send({
            "message" : "Please provide email and password"
        })
    }
    if(Object.keys(data).length == 0){
        res.status(400).send({
            "status":"400",
            "message":"Please enter valid data for the user"
        })
    }
    else if(!data.first_name || !data.last_name || !data.password || !data.email_address){
        res.status(204).send({
            "message" : "Please enter user details"
        })
    }
    else if(authenticateUser.name != data.email_address){
        res.status(401).send({
            "message" : "You cannot update email address or change another users data"
        })
    }
    else if(data.account_created || data.account_updated || data.id){
        res.status(401).send({
            "message":"User cannot update id, account_created and account_updated"
        })
    }
    else if(data.password && (JSON.stringify(data.password).length<8)){
        //const convertPasswordToString = JSON.stringify(data.password)
            res.status(400).send({
                "status":"400",
                "message":"Password must be greater than 8 characters"
            })
    }
    else{
        connection.query('SELECT * FROM UsersData where email_address = "'+authenticateUser.name+'"', (err, value) => {
            sdc.timing("timing.put.user_api.check_email_record", Date.now()-start)
            if(err){
                logger.error("user_PUT:Error - in checking email")
                res.status(400).send(err)
            }
            else if(value.length == 0){
                logger.info("user_PUT:INFO - no email records found")
                res.status(400).send({
                    "message" : "No such email-id exists"
                })
            }
            else{
                //If the given email exists, compare the password with database and allow update only if passwords match
                if(bcrypt.compare(authenticateUser.pass, value[0].password).then(function(match) {
                    if(match){
                        joi.validate(data.password, schemaPassword, (err, value) => {
                            if(err){
                                logger.error("user_PUT:Error - in matching password")
                                res.status(400).send({
                                    "message":"Bad Request",
                                    "description":"Please enter a valid email and password. The Password must contain atleast one uppercase letter, one lowercase letter, one number and one special character."
                                })
                            }
                            else{
                                data.account_updated = new Date();
                                bcrypt.hash(data.password, saltRounds).then(function(hash) {
                                    const sql = 'UPDATE UsersData SET first_name = ?, last_name = ?, password = ?, account_updated = ? WHERE email_address = "'+authenticateUser.name+'"'
                                    connection.query(sql, [data.first_name, data.last_name, hash, data.account_updated], (err, value) => {
                                        sdc.timing("timing.put.user_api.update records", Date.now()-start)
                                        if(err){
                                            return res.status(400).send(err)
                                        }
                                        else{
                                            logger.info(`user_PUT:INFO - ${authenticateUser.name}'s record updated successfully`)
                                            return res.status(200).send({
                                                "message" : "Updated Successfully"
                                            })
                                        }
                                    })
                                })
                            }
                        });
                    }
                    else{
                        logger.error('user_PUT:Error - invalid password')
                        res.status(401).send({
                            "message" : "Invalid Password"
                        })
                    }
                }));
            }

        });
    }
    sdc.timing("timing.put.user_api", Date.now()-start)
}