const router = require('express').Router();
const billFile = require('../controller/files')
// const multer = require('multer')
// const upload = multer({ dest: 'tmp/'})

/*
    Create a web-application with GET, POST, PUT REFTful APIs
    Technology Stack : Node.Js, MySQL, Express
*/

//POST API to create a file from controller/files.js
router.post('/:id/file', billFile.bill_create_file); 

//GET API to get a file from controller/files.js
router.get('/:id/file/:fileid', billFile.bill_get_file); 

module.exports = router;  