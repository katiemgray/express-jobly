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
      jobs (id, title, salary, equity, company_handle)   
      VALUES(
        1,
        'testJob', 
        22.22, 
        .50, 
        'testHandle2') RETURNING *`);

  let company = companyResult.rows[0];
  let job = result.rows[0];
});

// TESTING route for getting all jobs
describe('GET /jobs', async function() {
  test('gets all jobs', async function() {
    const response = await request(app).get(`/jobs`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('jobs');
  });
  // Testing for no results from query
  test('Responds with 200 if no job is found in the database', async function() {
    await db.query('DELETE FROM jobs');
    const response = await request(app).get(`/jobs`);
    expect(response.statusCode).toBe(200);
    expect(response.body.jobs).toEqual([]);
  });
});

describe('GET query string params', async function() {
  // TESTING route for getting specific jobs with a search query
  describe('GET /jobs?search', async function() {
    test('gets specific job(s) with query of title', async function() {
      const response = await request(app).get(`/jobs?search=testJob`);
      expect(response.statusCode).toBe(200);
      expect(response.body.jobs[0].title).toBe('testJob');
    });
    // Testing for no results from query
    test('Responds with 200 if no job is found', async function() {
      const response = await request(app).get(`/jobs?search=BADSEARCH`);
      expect(response.statusCode).toBe(200);
      expect(response.body.jobs).toEqual([]);
    });
  });

  // TESTING route to find a job with min salary of query
  describe('GET /jobs?min_salary', async function() {
    test('gets specific job(s) with query of min_salary', async function() {
      const response = await request(app).get(`/jobs?min_salary=10.50`);
      expect(response.statusCode).toBe(200);
      expect(response.body.jobs[0].title).toBe('testJob');
    });
    // Testing for no results from query
    test('Responds with 200 if no job is found', async function() {
      const response = await request(app).get(`/jobs?min_salary=100.50`);
      expect(response.statusCode).toBe(200);
      expect(response.body.jobs).toEqual([]);
    });
  });

  // TESTING route to find a job with min equity of query
  describe('GET /jobs?min_equity', async function() {
    test('gets specific job(s) with query of min_equity', async function() {
      const response = await request(app).get(`/jobs?min_equity=0.25`);
      expect(response.statusCode).toBe(200);
      expect(response.body.jobs[0].title).toBe('testJob');
    });
    // Testing for no results from query
    test('Responds with 200 if no job is found', async function() {
      const response = await request(app).get(`/jobs?min_equity=0.75`);
      expect(response.statusCode).toBe(200);
      expect(response.body.jobs).toEqual([]);
    });
  });

  // TESTING route for getting specific job with an id
  describe('GET /jobs/id', async function() {
    test('gets specific job with specific id', async function() {
      const response = await request(app).get(`/jobs/1`);
      expect(response.statusCode).toBe(200);
      expect(response.body.job.title).toBe('testJob');
    });
    // Testing for failures if no job is found with id provided
    test('Responds with 404 if no job is found with id provided', async function() {
      const response = await request(app).get(`/jobs/BADHANDLE`);
      expect(response.statusCode).toBe(404);
    });

    // TODO- more reqs for query string - what if they search for multiple query string params?
  });
});

/***************** END OF GET jobs tests *****************/
/***************** BEGINNING OF POST/PATCH/DELETE jobs tests  ***************/

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

// PATCH /jobs - updates job from specific handle provided in url, return {job: jobData}
describe('PATCH /jobs/:id', async function() {
  test('updates a job', async function() {
    const response = await request(app)
      .patch(`/jobs/1`)
      .send({
        title: 'updatedJobTitle',
        salary: 99.99,
        equity: 0.33,
        company_handle: 'testHandle2'
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.job.title).toBe('updatedJobTitle');
    expect(response.body.job.salary).toBe(99.99);
    expect(response.body.job.equity).toBe(0.33);
    expect(response.body.job.company_handle).toBe('testHandle2');
    // JSON schema validator will validate for bad user data
  });
  test('Responds with 404 if no job is found', async function() {
    const response = await request(app).patch(`/jobs/BADHANDLE`);
    expect(response.statusCode).toBe(404);
  });
});

// DELETE /jobs - deletes a job with matching id provided returning {message: "Job deleted"}
describe('DELETE /jobs/:id', async function() {
  test('deletes a job', async function() {
    const response = await request(app).delete(`/jobs/1`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ message: 'Job deleted' });
  });
  test('Responds with 404 if no company is found', async function() {
    const response = await request(app).delete(`/jobs/BADHANDLE`);
    expect(response.statusCode).toBe(404);
  });
});
/***************** END OF POST/PATCH/DELETE jobs tests *****************/

// Tear Down - removes records from test DB
afterEach(async function() {
  await db.query('DELETE FROM jobs');
  await db.query('DELETE FROM companies');
});

afterAll(async function() {
  await db.end();
});
