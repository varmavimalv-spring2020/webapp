const connection = require('../model/db')
const bcrypt = require('bcrypt')
const uuidv4 = require('uuid/v4')
const basicAuthentication = require('basic-auth')
const fs = require('fs');
const validateFile = require('../validations/fileValidation')

exports.bill_create_file = (req, res) => { 

    const authenticateUser = basicAuthentication(req)

    if(Object.keys(req.files).length > 1){
        return res.status(400).send({
            "message" : "You may attach only one file at a time"
        })
    }

    const attachment = req.files[Object.keys(req.files)[0]]
    const putSingleID = req.params.id
    const filePath = 'tmp/'+req.params.id+'_'+escape(attachment.name)

    validation_response = validateFile(req)
    if(validation_response.status != 200) {
        return res.status(validation_response.status).send({
            "status" : validation_response.status,
            "message" : validation_response.message
        })
    }
    //if both credentials given, check if the email exists in database, if it exists, check if the passwords match
    connection.query('SELECT * FROM UsersData where email_address = "'+authenticateUser.name+'"', (err, value) => {
        if(err) {
            return res.status(400).send(err)
        }
        if(value.length == 0) {
            return res.status(400).send({
                "message" : "No such email-id exists"
            })
        }
        bcrypt.compare(authenticateUser.pass, value[0].password).then(function(match) {
            if(match) {
                connection.query('SELECT Bill.* FROM Bill INNER JOIN UsersData on Bill.owner_id = "'+value[0].id+'" AND Bill.id = "'+putSingleID+'"', (err, result) => {
                    if(err) {
                        return res.status(400).send(err)
                    }
                    else if(result.length == 0) {
                        return res.status(404).send({
                            "message" : "No bills available for the requested ID"
                        })
                    }
                    connection.query('SELECT bill_id FROM File where bill_id = "'+putSingleID+'"', (err, ans) => {
                        var flag = false;
                        if(err) {
                            return res.status(400).send(err)
                        }
                        else if(ans.length !== 0) {
                            connection.query('DELETE FROM File WHERE bill_id = "'+putSingleID+'"',(err) => {
                                if(err){
                                    flag = true;
                                    return res.status(400).send(err)
                                }
                            })
                            const pathname = 'tmp/'
                            const regex = RegExp(putSingleID+"*", "g")
                            fs.readdirSync(pathname)
                            .filter(f => regex.test(f))
                            .map(f => fs.unlinkSync(pathname + f))
                        }
                        if (flag) {
                            return;
                        }
                        attachment.upload_date = new Date().toISOString().slice(0,10)
                        attachment.id = uuidv4();
                        attachment.bill_id = result[0].id
                        attachment.mv(`${filePath}`, function(err) {
                            attachment.url = `${filePath}`
                            if(err){
                                return res.status(400).send({
                                    "message" : "Bad Request"
                                })
                            }
                            const sql = "INSERT INTO File (file_name, id, url, upload_date, bill_id, mimeType, size, md5, originalName) VALUES (?,?,?,?,?,?,?,?,?)";
                            connection.query(sql, [attachment.name, attachment.id, attachment.url, attachment.upload_date, attachment.bill_id, attachment.mimetype, attachment.size, attachment.md5, attachment.name], (err, results) => {
                                if(err) {
                                    return res.status(400).send(err)
                                }
                                return res.status(201).send({
                                    "file_name" : attachment.name,
                                    "id" : attachment.id,
                                    "url" : attachment.url,
                                    "upload_date" : attachment.upload_date
                                })
                            })
                        })
                    })
                })
            } else {
                return res.status(404).send({
                    "message" : "Invalid Password"
                })
            }
        })
    })
}