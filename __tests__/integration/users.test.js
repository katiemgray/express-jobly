/** Integration tests for users route */

process.env.NODE_ENV = 'test';

const request = require('supertest');

const app = require('../../app');
const db = require('../../db');

beforeEach(async () => {
  let companyResult = await db.query(`
    INSERT INTO
      companies (handle, name, num_employees, description, logo_url)
      VALUES(
        'testHandle2',
        'testCompany2',
        1000,
        'The best test of the rest, I DO NOT JEST',
        'https://www.url.com') RETURNING *`);

  let jobResult = await db.query(`
    INSERT INTO 
      jobs (id, title, salary, equity, company_handle)   
      VALUES(
        1,
        'testJob', 
        22.22, 
        .50, 
        'testHandle2') RETURNING *`);

  let userResult = await db.query(`
    INSERT INTO 
      users (username,
        password,
        first_name,
        last_name,
        email,
        photo_url,
        is_admin)   
      VALUES(
        'testUsername',
        12345,
        'testFirstName',
        'testLastName',
        'test@test.com',
        'https://www.photo.com',
        'false') RETURNING *`);

  // job = result.rows[0];
});

// TESTING route for getting all users
describe('GET /users', async function() {
  test('gets all users', async function() {
    const response = await request(app).get(`/users`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('users');
    expect(response.body.users).toHaveLength(1);
  });
  // Testing for no results from query
  test('Responds with 200 if no user is found in the database', async function() {
    await db.query('DELETE FROM users');
    const response = await request(app).get(`/users`);
    console.log('THIS IS THE RESPONSE', response.body);
    expect(response.statusCode).toBe(200);
    expect(response.body.users).toEqual([]);
  });
});

// TESTING route for getting specific user with an username
describe('GET /users/username', async function() {
  test('gets specific user with specific username', async function() {
    const response = await request(app).get(`/users/testUsername`); // user.username
    expect(response.statusCode).toBe(200);
    expect(response.body.user.first_name).toBe('testFirstName');
  });
  // Testing for failures if no user is found with username provided
  test('Responds with 404 if no user is found with username provided', async function() {
    const response = await request(app).get(`/users/BADUSERNAME`);
    expect(response.statusCode).toBe(404);
  });

  // TODO- more reqs for query string - what if they search for multiple query string params?
});

/***************** END OF GET jobs tests *****************/
/***************** BEGINNING OF POST/PATCH/DELETE jobs tests  ***************/

// POST /users - create user from data; return {user: userData}
describe('POST /users', async function() {
  test('creates a new user', async function() {
    const response = await request(app)
      .post(`/users`)
      .send({
        username: 'newUser',
        password: '123',
        first_name: 'Jon',
        last_name: 'Kung',
        email: 'j@j.com',
        photo_url: '',
        is_admin: false
      });
    console.log(
      `This is in the test for POST users, response is: `,
      response.body
    );
    expect(response.statusCode).toBe(200);
    expect(response.body.user.username).toBe('newUser');
    expect(response.body.user.password).toBe('123');
    expect(response.body.user.first_name).toBe('Jon');
    expect(response.body.user.is_admin).toBe(false);
    // JSON schema validator will validate for bad user data
  });
  test('Responds with 409 if username is taken', async function() {
    const response = await request(app)
      .post(`/users`)
      .send({
        username: 'testUsername',
        password: 123,
        first_name: 'Jon',
        last_name: 'Kung',
        email: 'j@j.com',
        photo_url: '',
        is_admin: false
      });
    expect(response.statusCode).toBe(409);
  });
});

// PATCH /users - updates user from specific handle provided in url, return {user: userData}
describe('PATCH /users/:username', async function() {
  test('updates a user', async function() {
    const response = await request(app)
      .patch(`/users/testUsername`)
      .send({
        username: 'testUsername',
        password: 123,
        first_name: 'Jon',
        last_name: 'Kung',
        email: 'j@j.com',
        photo_url: '',
        is_admin: false
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.user.username).toBe('testUsername');
    expect(response.body.user.first_name).toBe('Jon');
    expect(response.body.user.last_name).toBe('Kung');
    expect(response.body.user.email).toBe('j@j.com');
    // JSON schema validator will validate for bad user data
  });
  test('Responds with 404 if no user is found', async function() {
    const response = await request(app)
      .patch(`/users/BADUSERNAME`)
      .send({
        username: 'BADUSERNAME',
        password: '123',
        first_name: 'Test',
        last_name: 'TestLastName',
        email: 'j@j.com',
        photo_url: '',
        is_admin: false
      });
    expect(response.statusCode).toBe(404);
  });
});

// DELETE /users - deletes a user with matching id provided returning {message: "user deleted"}
describe('DELETE /users/:username', async function() {
  test('deletes a user', async function() {
    const response = await request(app).delete(`/users/testUsername`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ message: 'User deleted' });
  });
  test('Responds with 404 if no user is found', async function() {
    const response = await request(app).delete(`/users/BADHANDLE`);
    expect(response.statusCode).toBe(404);
  });
});
/***************** END OF POST/PATCH/DELETE users tests *****************/

// Tear Down - removes records from test DB
afterEach(async function() {
  await db.query('DELETE FROM users');
  await db.query('DELETE FROM jobs');
  await db.query('DELETE FROM companies');
});

afterAll(async function() {
  await db.end();
});
