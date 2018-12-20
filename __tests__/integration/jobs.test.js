/** Integration tests for jobs route */

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

  let result = await db.query(`
    INSERT INTO 
      jobs (title, salary, equity, company_handle)   
      VALUES(
        'testJob', 
        22.22, 
        .50, 
        'testHandle2') RETURNING *`);

  let company = companyResult.rows[0];
  let job = result.rows[0];
});

// POST /jobs - create job from data; return {job: jobData}
describe('POST /jobs', async function() {
  test('creates a new job', async function() {
    const response = await request(app)
      .post(`/jobs`)
      .send({
        title: 'banana manager',
        salary: 33.33,
        equity: 0.75,
        company_handle: 'testHandle2'
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.job.title).toBe('banana manager');
    expect(response.body.job.salary).toBe(33.33);
    expect(response.body.job.equity).toBe(0.75);
    expect(response.body.job.company_handle).toBe('testHandle2');
    // JSON schema validator will validate for bad user data
  });
  test('Responds with 400 if handle is not found', async function() {
    const response = await request(app)
      .post(`/jobs`)
      .send({ handle: 'BADHANDLE', title: 'taco' });
    expect(response.statusCode).toBe(400);
  });
});

// Tear Down - removes records from test DB
afterEach(async function() {
  await db.query('DELETE FROM jobs');
  await db.query('DELETE FROM companies');
});

afterAll(async function() {
  await db.end();
});
