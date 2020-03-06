const chai = require('chai').expect;
const supertest = require('supertest');
const app = require('../app');
const expect = chai.expect

//Check for wrong credentials
describe('GET /bill/:id', () => {
    it('Unsuccessful Login', function(done) {
        supertest(app)
        .get('/v1/bill/:id')
        .auth('jane.doe@example.com', 'Welme@123')
        .expect(404,done)
    })
})