const request = require('supertest');
const testConfig = require('../test.config');
const createApp  = require('../service');
const { Role, DB } = require('../database/database.js');

let app;
let testAdmin;
let testAdminAuthToken;
let db;
let itemRes;
let franchiseId;

beforeAll(async () => {

    if (!testConfig.db.connection.database){
      testConfig.db.connection.database = randomName();
    }
    app = await createApp(testConfig);
    db = new DB(testConfig);
    await db.initialized;

    testAdmin = await createAdminUser(db);  
    const loginRes = await request(app).put('/api/auth').send(testAdmin);
    testAdminAuthToken = loginRes.body.token;

    const newMenuItem = { title:"test", description: "yummy", image:"pizza4.png", price: 0.0002 };
    itemRes = await request(app).put('/api/order/menu').auth(testAdminAuthToken, { type: 'bearer' }).send(newMenuItem);
    console.log(itemRes.body);
    const newFranchise = { name: 'new franchise', admins: [{email: testAdmin.email}] };
    const createRes = await request(app).post('/api/franchise').auth(testAdminAuthToken, { type: 'bearer' }).send(newFranchise);
    franchiseId = createRes.body.id;
    const newStore = { franchiseId: franchiseId, name: 'new store'};
    const storeRes = await request(app).post(`/api/franchise/${franchiseId}/store`).auth(testAdminAuthToken, { type: 'bearer' }).send(newStore);
    console.log(storeRes.body);



      
  
});


// test('create order', async () => {
//     const orderRes = await request(app).post('/api/order').auth(testAdminAuthToken, { type: 'bearer' }).send(newOrder);
//     console.log(orderRes.body);
//     expect(orderRes.status).toBe(200);
//     expect(orderRes.body).toEqual({order: newOrder, jwt: expect.anything()});


// });


test('get pizza menu', async () => {
    const listRes = await request(app).get('/api/order/menu');
    expect(listRes.status).toBe(200);
    expect(listRes.body).toEqual(itemRes.body);

});

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