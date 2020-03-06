const chai = require('chai').expect;
const supertest = require('supertest');
const app = require('../app');
const expect = chai.expect

//Check for correct credentials
describe('GET /bill', () => {
    it('User logged in successfully', function(done) {
        supertest(app)
        .get('v1/bill')
        .auth('jane.doe@example.com', 'ChangePass@123')
        .expect(200,done)
    })
})

//Check for wrong credentials
describe('GET /bill', () => {
    it('Unsuccessful Login', function(done) {
        supertest(app)
        .get('v1/bill')
        .auth('jane.doe@example.com', 'Welme@123')
        .expect(400,done)
    })
})