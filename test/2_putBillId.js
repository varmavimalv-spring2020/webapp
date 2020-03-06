const chai = require('chai').expect;
const supertest = require('supertest');
const app = require('../app');
const expect = chai.expect
const connection = require('../model/db')

//Check for wrong credentials
describe('PUT /bill/:id', () => {
        it('Unsuccessful Login', function(done) {
            connection.query('SELECT id from Bill', (err, result) => {
            supertest(app)
            .put('v1/bill/' +result[0].id)
            .auth('jane.doe@example.com', 'Welme@123')
            .send({
                "vendor": "Northeastern University",
                "bill_date": "2020-01-06",
                "due_date": "2020-01-12",
                "amount_due": 7000.51,
                "categories": [
                  "college",
                  "tuition",
                  "spring2020"
                ],
                "paymentStatus": "paid"
            })
            .expect(404,done)
        })
    })
})

//Create with request body missing data
describe('PUT /bill/:id', () => {
        it('Add all contents to create', function(done) {
            connection.query('SELECT id from Bill', (err, result) => {
            supertest(app)
            .put('v1/bill/' +result[0].id)
            .auth('jane.doe@example.com', 'ChangePass@123')
            .send({
                "vendor": "Northeastern University",
                "bill_date": "2020-01-06",
                "due_date": "2020-01-12",
                "amount_due": 7000.51,
                "categories": [
                  "college",
                  "tuition",
                  "spring2020"
                ]
            })
            .expect(400, done)
        })
    })
})

  //Check for duplicate category values
describe('PUT /bill/:id', () => {
    it('Okay, no duplicates allowed for categories', (done) => {
        connection.query('SELECT id from Bill', (err, result) => {
        supertest(app)
        .put('v1/bill/' +result[0].id)
        .auth('jane.doe@example.com', 'ChangePass@123')
        .send({
            "vendor": "Northeastern University",
            "bill_date": "2020-01-06",
            "due_date": "2020-01-12",
            "amount_due": 7000.51,
            "categories": [
                "college",
                "college",
                "spring2020"
            ],
            "paymentStatus": "paid"
        })
        .expect(400, done)
    })
})
})

//Check for correct bill creation
describe('PUT /bill/:id', () => {
    it('Okay, Create bill', (done) => {
        connection.query('SELECT id from Bill', (err, result) => {
        supertest(app)
        .put('v1/bill/' +result[0].id)
        .auth('jane.doe@example.com', 'ChangePass@123')
        .send({
            "vendor": "Northeastern University",
            "bill_date": "2020-01-06",
            "due_date": "2020-01-12",
            "amount_due": 7000.51,
            "categories": [
              "college",
              "tuition",
              "spring2020"
            ],
            "paymentStatus": "paid"
        })
        .expect(200,done)
    })
})
})