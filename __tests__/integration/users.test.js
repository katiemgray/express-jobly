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

// Tear Down - removes records from test DB
afterEach(async function() {
  await db.query('DELETE FROM users');
  await db.query('DELETE FROM jobs');
  await db.query('DELETE FROM companies');
});

afterAll(async function() {
  await db.end();
});
