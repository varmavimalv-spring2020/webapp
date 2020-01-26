const chai = require('chai').expect;
const supertest = require('supertest');
const app = require('../app');
const expect = chai.expect

//Update without request body
 describe('PUT /users/self', () => {
    it('No Content Added to Update', function(done) {
        supertest(app)
        .put('/users/self')
        .auth('jane.doe@example.com', 'Welcome@123')
        .send({

        })
        .expect(204,done)
    })
  });

//Update with email update
  describe('PUT /users/self', () => {
    it('Cannot Update Email', function(done) {
        supertest(app)
        .put('/users/self')
        .auth('jane.doe@example.com', 'Welcome@123')
        .send({
            "first_name": "Jane",
            "last_name": "Doe",
            "password": "Welcome@123",
            "email_address": "jane11.doe@example.com"
        })
        .expect(401,done)
    })
  });

  //Correct Update
  describe('PUT /users/self', () => {
    it('Cannot Update Email', function(done) {
        supertest(app)
        .put('/users/self')
        .auth('jane.doe@example.com', 'Welcome@123')
        .send({
            "first_name": "Jane",
            "last_name": "Doe",
            "password": "ChangePass@123",
            "email_address": "jane.doe@example.com"
        })
        .expect(200,done)
    })
  });