/** Integration tests for companies route */

process.env.NODE_ENV = 'test';

const request = require('supertest');

const app = require('../../app');
const db = require('../../db');

beforeEach(async () => {
  let result = await db.query(`
    INSERT INTO 
      companies (handle, name, num_employees, description, logo_url)   
      VALUES(
        'testHandle', 
        'testCompany', 
        100, 
        'The best test of the rest, I DO NOT JEST', 
        'https://www.url.com') RETURNING *`);

  // console.log('this is the result', result);

  let companies = result.rows[0];
});

describe('GET /companies', async function() {
  test('gets all companies', async function() {
    const response = await request(app).get(`/companies`);
    console.log('this is the RESPONSE STATUS', response.body);
    expect(response.statusCode).toBe(200);
    expect(response.body.companies[0].name).toBe('testCompany');
  });
});

afterEach(async function() {
  await db.query('DELETE FROM COMPANIES');
});

afterAll(async function() {
  await db.end();
});
