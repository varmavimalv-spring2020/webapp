const router = require('express').Router();
const userBill = require('../controller/bill')

/*
    Create a web-application with GET, POST, PUT REFTful APIs
    Technology Stack : Node.Js, MySQL, Express
*/

//POST API to create a user from controller/users.js
router.post('/', userBill.users_create_bill); 

module.exports = router;  