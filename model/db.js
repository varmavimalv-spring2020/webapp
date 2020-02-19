const mysql = require('mysql');
require('dotenv').config()


//Setting up mySQL database connection
const connection = mysql.createConnection({
    host : process.env.DB_HOST,
    user : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
});

connection.connect((err) => {
    if(err){
        throw err;
    }
    connection.query('CREATE DATABASE if not exists '+process.env.DB_NAME+';', (err, result) => {
        if(err) throw err;
    }) 
    connection.query('USE '+process.env.DB_NAME+';', (err, result) => {
        if(err) throw err;
    }) 
    const createUsersData = `CREATE TABLE if not exists UsersData ( 
        id varchar(100) NOT NULL,
        first_name varchar(100) NOT NULL,
        last_name varchar(100) NOT NULL,
        password varchar(100) NOT NULL,
        email_address varchar(100) NOT NULL,
        account_created timestamp(6) NULL DEFAULT NULL,
        account_updated timestamp(6) NULL DEFAULT NULL,
        PRIMARY KEY (id))`;
    connection.query(createUsersData, (err, result) => {
        if(err) throw err;
    }) 
    const createBill = `CREATE TABLE if not exists Bill ( 
        id varchar(100) NOT NULL,
        created_ts timestamp(6) NULL DEFAULT NULL,
        updated_ts timestamp(6) NULL DEFAULT NULL,
        owner_id varchar(100) NOT NULL,
        vendor varchar(100) DEFAULT NULL,
        bill_date varchar(50) DEFAULT NULL,
        due_date date DEFAULT NULL,
        amount_due double DEFAULT NULL,
        categories varchar(100) DEFAULT NULL,
        paymentStatus enum('paid','due','past_due','no_payment_required') DEFAULT NULL,
        attachment varchar(1000) DEFAULT '{}',    
        PRIMARY KEY (id),
        KEY FK_id (owner_id),
        CONSTRAINT FK_id FOREIGN KEY (owner_id) REFERENCES UsersData (id))`;
    connection.query(createBill, (err, result) => {
        if(err) throw err;
    })
    const createFile = `CREATE TABLE if not exists File (
        file_name varchar(100) NOT NULL,
        id varchar(100) NOT NULL,
        url varchar(100) DEFAULT NULL,
        upload_date varchar(100) DEFAULT NULL,
        bill_id varchar(100) DEFAULT NULL,
        mimeType varchar(100) DEFAULT NULL,
        size double DEFAULT NULL,
        md5 varchar(100) DEFAULT NULL,
        originalName varchar(100) DEFAULT NULL,
        PRIMARY KEY (id),
        KEY foreign_key (bill_id),
        CONSTRAINT File_ibfk_1 FOREIGN KEY (bill_id) REFERENCES Bill (id))`;
    connection.query(createFile, (err, result) => {
        if(err) throw err;
    })          
});

module.exports = connection;