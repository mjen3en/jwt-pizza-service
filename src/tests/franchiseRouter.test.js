const request = require('supertest');
const e = require('express');
const testConfig = require('../test.config');
const createApp  = require('../service');

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
let testUserAuthToken;
let testUserId;
let app;
// const { Role, DB } = require('../database/database.js');

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

test('list franchises', async () => {
    const listRes = await request(app).get('/api/franchise');
    expect(listRes.status).toBe(200);
    console.log(listRes.body);

});

test('list user franchises', async () => {
    //create a new user and save token and id before each test
    const testUser = { name: 'pizza diner', email: generateNewEmail(), password: 'a' };
    const registerRes = await request(app).post('/api/auth').send(testUser);
    testUserAuthToken = registerRes.body.token;
    testUserId = registerRes.body.user.id;

    //add franchise

    //get list of user franchises
    const listRes = await request(app).get(`/api/franchise/${testUserId}`).auth(testUserAuthToken, { type: 'bearer' });
    expect(listRes.status).toBe(200);
    console.log(listRes.body);

});

test('create franchise', async () => {
    
    //create a new admin user and save token and id before each test
    const testAdmin = 
    console.log(testUser);
    //testUserId = loginRes.body.user.id;

    //create franchise  
    // const newFranchise = { name: 'new franchise', userId: testUserId };
    // const createRes = await request(app).post('/api/franchise').auth(testUserAuthToken, { type: 'bearer' }).send(newFranchise);
    // expect(createRes.status).toBe(200);
    // console.log(createRes.body);
    // expect(createRes.body).toMatchObject(newFranchise);
});

generateNewEmail = () => {  
    return Math.random().toString(36).substring(2, 12) + '@test.com';
  }

function randomName() { 
    return Math.random().toString(36).substring(2, 12);
    }



// async function createAdminUser() {
//   let user = { password: 'toomanysecrets', roles: [{ role: Role.Admin }] };
//   user.name = randomName();
//   user.email = user.name + '@admin.com';

//   user = await DB.addUser(user);
//   return { ...user, password: 'toomanysecrets' };
// }
