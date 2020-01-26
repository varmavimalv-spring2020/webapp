const router = require('express').Router();
const usersController = require('../controller/users')

/*
    Create a web-application with GET, POST, PUT REFTful APIs
    Technology Stack : Node.Js, MySQL, Express
*/

//GET API to fetch user data from controller/users.js
router.get('/self', usersController.users_get_user_self);

//POST API to create a user from controller/users.js
router.post('/', usersController.users_create); 

//PUT API to update user data from controller/users.js
router.put('/self', usersController.users_update);

module.exports = router;   