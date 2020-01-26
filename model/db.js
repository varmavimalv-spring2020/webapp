const mysql = require('mysql');
require('dotenv').config()


//Setting up mySQL database connection
const connection = mysql.createConnection({
    host : process.env.DB_HOST,
    user : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
    database : process.env.DB_NAME,
});

connection.connect((err) => {
    if(err){
        throw err;
    }
});

module.exports = connection;