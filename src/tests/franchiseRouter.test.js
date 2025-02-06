const request = require('supertest');
const testConfig = require('../test.config');
const createApp  = require('../service');
const { Role, DB } = require('../database/database.js');

let testUserAuthToken;
let testUserId;
let app;
let db;
let testAdmin;
let testAdminAuthToken;
let createRes;
// const { Role, DB } = require('../database/database.js');

beforeAll(async () => {
    if (!testConfig.db.connection.database){
      testConfig.db.connection.database = randomName();
    }
    app = await createApp(testConfig);
    db = new DB(testConfig);
    await db.initialized;

    //create a new admin user and save token and id before each test
    testAdmin = await createAdminUser(db);  
    const loginRes = await request(app).put('/api/auth').send(testAdmin);
    testAdminAuthToken = loginRes.body.token;
  

    //create franchise  
    const newFranchise = { name: 'new franchise', admins: [{email: testAdmin.email}] };
    createRes = await request(app).post('/api/franchise').auth(testAdminAuthToken, { type: 'bearer' }).send(newFranchise);
    console.log(createRes.body);  
    
  });

test('create franchise store', async () => {
    const newStore = { franchiseId: createRes.body.id, name: 'new store'};
    const storeRes = await request(app).post(`/api/franchise/${createRes.body.id}/store`).auth(testAdminAuthToken, { type: 'bearer' }).send(newStore);
    expect(storeRes.status).toBe(200);
    console.log(storeRes.body);
    expect(storeRes.body).toEqual({id:expect.anything() , franchiseId: newStore.franchiseId, name: newStore.name});

  
});

test('delete franchise store', async () => {

    const newStore = { franchiseId: createRes.body.id, name: 'newer store'};
    const storeRes = await request(app).post(`/api/franchise/${createRes.body.id}/store`).auth(testAdminAuthToken, { type: 'bearer' }).send(newStore);
    expect(storeRes.status).toBe(200);
    console.log(storeRes.body);
    expect(storeRes.body).toEqual({id:expect.anything() , franchiseId: newStore.franchiseId, name: newStore.name});

    const deleteRes = await request(app).delete(`/api/franchise/${createRes.body.id}/store/${storeRes.body.id}`).auth(testAdminAuthToken, { type: 'bearer' });
    expect(deleteRes.status).toBe(200);
    console.log(deleteRes.body);
    expect(deleteRes.body).toEqual({ message: 'store deleted' });
});

test('delete franchise', async () => {
    const prelistRes = await request(app).get('/api/franchise');

    
    const newerFranchise = { name: 'new franchise', admins: [{email: testAdmin.email}] };
    const newCreateRes = await request(app).post('/api/franchise').auth(testAdminAuthToken, { type: 'bearer' }).send(newerFranchise);

    const deleteRes = await request(app).delete(`/api/franchise/${newCreateRes.body.id}`).auth(testAdminAuthToken, { type: 'bearer' });
    expect(deleteRes.status).toBe(200);
    const postlistRes = await request(app).get('/api/franchise');
    expect(postlistRes.body).toEqual(prelistRes.body);



});


test('list franchises', async () => {
    const listRes = await request(app).get('/api/franchise');
    expect(listRes.status).toBe(200);
    console.log(listRes.body); 
    expect(listRes.body).toEqual([{ id: createRes.body.id, name: createRes.body.name, stores: expect.anything()}]);


});

test('list user franchises', async () => {
    //create a new user and save token and id before each test
    const testUser = { name: 'pizza diner', email: generateNewEmail(), password: 'a' };
    const registerRes = await request(app).post('/api/auth').send(testUser);
    testUserAuthToken = registerRes.body.token;
    testUserId = registerRes.body.user.id;

    //get list of user franchises
    const listRes = await request(app).get(`/api/franchise/${testUserId}`).auth(testUserAuthToken, { type: 'bearer' });
    expect(listRes.status).toBe(200);
    console.log(listRes.body);

});


const generateNewEmail = () => {  
    return Math.random().toString(36).substring(2, 12) + '@test.com';
  }

function randomName() { 
    return Math.random().toString(36).substring(2, 12);
    }


async function createAdminUser(db) {
  let user = { password: 'toomanysecrets', roles: [{ role: Role.Admin }] };
  user.name = randomName();
  user.email = user.name + '@admin.com';

  user = await db.addUser(user);
  return { ...user, password: 'toomanysecrets' };
}
