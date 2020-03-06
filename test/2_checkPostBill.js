const chai = require('chai').expect;
const supertest = require('supertest');
const app = require('../app');

//Check for Wrong Password
describe('POST /bill', () => {
    it('Unsuccessful Login', function(done) {
        supertest(app)
        .post('v1/bill')
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
            "paymentStatus": "paid",
            "attachment" : {}
        })
        .expect(401,done)
    })
})

//Create with request body missing data
describe('POST /bill', () => {
    it('Add all contents to create', function(done) {
        supertest(app)
        .post('v1/bill')
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
  });

//Check for duplicate category values
describe('POST /bill', () => {
    it('Okay, no duplicates allowed for categories', (done) => {
        supertest(app)
        .post('v1/bill')
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
            "paymentStatus": "paid",
            "attachment" : {}
        })
        .expect(400, done)
    })
})

//Check for incorrect date format
describe('POST /bill', () => {
    it('Okay, cannot create incorrect date format', (done) => {
        supertest(app)
        .post('v1/bill')
        .auth('jane.doe@example.com', 'ChangePass@123')
        .send({
            "vendor": "Northeastern University",
            "bill_date": "01-06-2020",
            "due_date": "2020-01-12",
            "amount_due": 7000.51,
            "categories": [
                "college",
                "college",
                "spring2020"
            ],
            "paymentStatus": "paid",
            "attachment" : {}
        })
        .expect(400,done)
    })
})

//Check for correct bill creation
describe('POST /bill', () => {
    it('Okay, Create bill', (done) => {
        supertest(app)
        .post('v1/bill')
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
            "paymentStatus": "paid",
            "attachment" : JSON.stringify(new Object())
        })
        .expect(201,done)
    })
})