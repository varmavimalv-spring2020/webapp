const basicAuthentication = require('basic-auth')
const path = require('path')


function validateFile(req) {
    const authenticateUser = basicAuthentication(req)
    const basicAuthCheck = req.headers.authorization

    res = {status: "", message: ""}

    if(!basicAuthCheck) {
        res.status = 401
        res.message = "Unauthorized Access"
        return res
    }

    else if(!authenticateUser.name || !authenticateUser.pass){
        res.status = 400
        res.message = "Please provide email and password"
        return res
    }

    else if (!req.files || Object.keys(req.files).length === 0) {
        res.status = 400
        res.message = "Please attach a file"
        return res
    }

    const attachment = req.files[Object.keys(req.files)[0]]
    const fileExtension = path.extname(attachment.name)
    
    if(fileExtension !== '.pdf' && fileExtension !== '.png' && fileExtension !== '.jpg' && fileExtension !== '.jpeg') {
        res.status = 400
        res.message = "Please attach a file of type pdf, jpg, jpeg or png only"
        return res
    }
    res.status = 200
    return res
}

module.exports = validateFile
 
    

    