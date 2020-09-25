// const assert = require('assert');
// const expect = require('chai').expect
// const request = require('supertest');
// const app = require('./app')
//
// describe('Unit testing the / route', function() {
//
//     it('should return OK status', function() {
//         return request(app)
//             .get('/')
//             .then(function(response){
//                 assert.equal(response.status, 200)
//             })
//     });
//
//     it('should return message on rendering', function() {
//         return request(app)
//             .get('/')
//             .then(function(response){
//                 expect(response.text).to.contain('im alive"}');
//             })
//     });
//
// });
//
// describe('Unit testing for /getConnectionDetails route', function() {
//
//     it('should return OK status', function() {
//         return request(app)
//             .get('/getConnectionDetails')
//             .then(function(response){
//                 assert.equal(response.status, 200)
//             })
//     });
//
//     it('should return list of connection details', function() {
//         const serverObj = {
//             id : "UUID_1213",
//             loaded : true,
//             age : 22,
//             name : "S1",
//             cluster : ""
//         }
//         return request(app)
//             .get('/getConnectionDetails ')
//             .then(function(response){
//                 expect(response).to.contain(serverObj);
//             })
//     });
//
// });
