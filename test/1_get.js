const chai = require('chai').expect;
const supertest = require('supertest');
const app = require('../app');
const expect = chai.expect

//Check for correct credentials
describe('GET /users/self', () => {
    it('User logged in successfully', function(done) {
        supertest(app)
        .get('/users/self')
        .auth('jane.doe@example.com', 'Welcome@123')
        .expect(200,done)
    })
})

//Check for wrong credentials
describe('GET /users/self', () => {
    it('Unsuccessful Login', function(done) {
        supertest(app)
        .get('/users/self')
        .auth('jane.doe@example.com', 'Welme@123')
        .expect(401,done)
    })
})
