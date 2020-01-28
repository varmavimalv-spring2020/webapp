const chai = require('chai').expect;
const supertest = require('supertest');
const app = require('../app');

//Check for Wrong Password
describe('POST /users', () => {
    it('Okay, Cannot create with wrong Password', (done) => {
        supertest(app)
        .post('/users')
        .send({
            "first_name": "Jane",
            "last_name": "Doe",
            "password": "skdjfhskdfjhg",
            "email_address": "jane.doe@example.com"
        })
        .expect(400, done)
    })
})

//Check for Wrong Email
describe('POST /users', () => {
    it('Okay, Cannot create with wrong email ID', (done) => {
        supertest(app)
        .post('/users')
        .send({
            "first_name": "Jane",
            "last_name": "Doe",
            "password": "skdjfhskdfjhg",
            "email_address": "jane.doe"
        })
        .expect(400, done)
    })
})

//Check for account_updated
describe('POST /users', () => {
    it('Okay, account_updated cannot be changed', (done) => {
        supertest(app)
        .post('/users')
        .send({
            "first_name": "Jane",
            "last_name": "Doe",
            "password": "skdjfhskdfjhg",
            "email_address": "jane.doe@example.com",
            "account_updated" : "2016-08-29T09:12:33.001Z"
        })
        .expect(401, done)
    })
})

//Check for Correct Data
describe('POST /users', () => {
    it('Okay, Creating a new user works', (done) => {
        supertest(app)
        .post('/users')
        .send({
            "first_name": "Jane",
            "last_name": "Doe",
            "password": "Welcome@123",
            "email_address": "jane.doe@example.com"
        })
        .expect(201,done)
    })
})

//Check for Duplicate Email
describe('POST /users', () => {
    it('Okay, Error For Duplicate Email Works', (done) => {
        supertest(app)
        .post('/users')
        .send({
            "first_name": "Jane",
            "last_name": "Doe",
            "password": "Welcome@123",
            "email_address": "jane.doe@example.com"
        })
        .expect(400,done)
    })
})