const request = require('supertest');
const e = require('express');
const testConfig = require('../test.config');
const createApp  = require('../service');

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
let testUserAuthToken;
let testUserId;
let app;

beforeAll(async () => {

    if (!testConfig.db.connection.database){
      testConfig.db.connection.database = randomName();
    }
    app = await createApp(testConfig);
  
});

beforeEach(async () => {

});

afterEach(async () => {

});

test('Get Pizza Menu', async () => {
    const listRes = await request(app).get('/api/order/menu');
    expect(listRes.status).toBe(200);
    console.log(listRes.body);

});