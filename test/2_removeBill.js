const chai = require('chai').expect;
const supertest = require('supertest');
const app = require('../app');
const expect = chai.expect
const connection = require('../model/db')

//Delete Bill
describe('DELETE /bill/:id', () => {
        it('Deleted', function(done) {
            connection.query('SELECT id from Bill', (err, result) => {
            supertest(app)
            .delete('v1/bill/' +result[0].id)
            .auth('jane.doe@example.com', 'ChangePass@123')
            .expect(204,done)
        })
    })
})
