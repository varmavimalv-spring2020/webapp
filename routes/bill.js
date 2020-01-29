const router = require('express').Router();
const userBill = require('../controller/bill')

/*
    Create a web-application with GET, POST, PUT REFTful APIs
    Technology Stack : Node.Js, MySQL, Express
*/

//POST API to create a bill from controller/bill.js
router.post('/', userBill.users_create_bill); 

//GET API to get a bill from controller/bill.js
router.get('/', userBill.users_get_bills); 

module.exports = router;  