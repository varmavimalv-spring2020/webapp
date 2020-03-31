const router = require('express').Router();
const userBill = require('../controller/bill')

/*
    Create a web-application with GET, POST, PUT REFTful APIs
    Technology Stack : Node.Js, MySQL, Express
*/

//POST API to create a bill from controller/bill.js
router.post('/', userBill.users_create_bill); 

//GET API to get all bills from controller/bill.js
router.get('/', userBill.users_get_bills); 

//GET API to get a bill based on ID from controller/bill.js
router.get('/:id', userBill.users_get_bills_id); 

//GET API to get a bill due in x days from controller/bill.js
router.get('/due/:x', userBill.users_get_bills_due); 

//PUT API to update a bill based on ID from controller/bill.js
router.put('/:id', userBill.users_update_bills_id);

//DELETE API to delete a bill based on ID from controller/bill.js
router.delete('/:id', userBill.delete_bill_id);

module.exports = router;  