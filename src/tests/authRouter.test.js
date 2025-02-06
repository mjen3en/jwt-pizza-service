const request = require('supertest');
const testConfig = require('../test.config');
const createApp  = require('../service');

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
let testUserAuthToken;
let app;

beforeAll(async () => {

  if (!testConfig.db.connection.database){
    testConfig.db.connection.database = randomName();
  }
  app = await createApp(testConfig);

});

beforeEach(async () => {
  //register a new user and save token and id before each test
  testUser.email = generateNewEmail() + '@test.com';
  const registerRes = await request(app).post('/api/auth').send(testUser);
  testUserAuthToken = registerRes.body.token;
});

afterEach(async () => {
  // logout user after each test
  const logout = await request(app).delete(`/api/auth/`).auth(testUserAuthToken, { type: 'bearer' });
  console.log(logout.body);
});

test('register', async () => {
    const newUser = { name: 'new diner', email: generateNewEmail() + '@test.com', password: 'b' };
    const registerTest = await request(app).post('/api/auth').send(newUser);
    expect(registerTest.status).toBe(200);
    expect(registerTest.body.token).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
    const { password, ...user } = { ...newUser, roles: [{ role: 'diner' }] };
    expect(registerTest.body.user).toMatchObject(user);
  });

test('login', async () => {
  const loginRes = await request(app).put('/api/auth').send(testUser);
  console.log('Login Response:', loginRes.body.user);
  expect(loginRes.status).toBe(200);
  testUserAuthToken = loginRes.body.token;
  console.log(testUserAuthToken); 
  expect(testUserAuthToken).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
  console.log(loginRes.body.user);

  const { password, ...user } = { ...testUser, roles: [{ role: 'diner' }] };
  expect(loginRes.body.user).toMatchObject(user);
});

test('update', async () => {
  const loginRes = await request(app).put('/api/auth').send(testUser);
  testUserAuthToken = loginRes.body.token
  console.log('Login Response:', loginRes.body.user);
  const testUserID = loginRes.body.user.id;
  console.log(testUserID);
  expect(testUserID).not.toBeNull();

  const updatedUser = { ...testUser, email: generateNewEmail(), password: 'c' };
  const updateRes = await request(app).put(`/api/auth/${testUserID}`).auth(testUserAuthToken, { type: 'bearer' }).send(updatedUser);
  console.log("Updated User:", updatedUser);
  console.log('Update Response:', updateRes.body);  
  expect(updateRes.status).toBe(200);
  const { password, ...userWithoutPassword } = updatedUser;
  console.log("User without password:", userWithoutPassword);
  console.log("Update Response Body:", updateRes.body);
  expect(updateRes.body).toMatchObject(userWithoutPassword);
});


test('logout', async () => { 
  const loginRes = await request(app).put('/api/auth').send(testUser);
  testUserAuthToken = loginRes.body.token
  console.log('Login Response:', loginRes.body.user);
  const logout = await request(app).delete(`/api/auth/`).auth(testUserAuthToken, { type: 'bearer' });
  expect(logout.status).toBe(200);
  expect(logout.body).toMatchObject({ message: 'logout successful' });

});

const generateNewEmail = () => {  
  return Math.random().toString(36).substring(2, 12) + '@test.com';
}

function randomName() { 
  return Math.random().toString(36).substring(2, 12);
}
