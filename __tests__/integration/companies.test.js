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

// TESTING route for getting all companies
describe('GET /companies', async function() {
  test('gets all companies', async function() {
    const response = await request(app).get(`/companies`);
    expect(response.statusCode).toBe(200);
    expect(response.body.companies[0]).toHaveProperty('handle');
    expect(response.body.companies[0]).toHaveProperty('name');
  });
  // TESTING for failures if no company exists in the DB
  test('Responds with 500 if no company is found', async function() {
    await db.query('DELETE FROM companies');
    const response = await request(app).get(`/companies`);
    expect(response.statusCode).toBe(500);
  });
});

// TESTING route for getting specific companies with a search query
describe('GET /companies/search', async function() {
  test('gets specific company(s) with query of name or handle', async function() {
    const response = await request(app).get(`/companies?search=testCompany`);
    expect(response.statusCode).toBe(200);
    expect(response.body.companies[0].name).toBe('testCompany');
  });
  // Testing for failures if no company is found with the search query
  test('Responds with 500 if no company is found', async function() {
    const response = await request(app).get(`/companies?search=BADSEARCH`);
    expect(response.statusCode).toBe(500);
  });
});

// TESTING route to find a company with min employee count of query
describe('GET /companies/min_employees', async function() {
  test('gets specific company(s) with query of min_employees', async function() {
    const response = await request(app).get(`/companies?min_employees=99`);
    expect(response.statusCode).toBe(200);
    expect(response.body.companies[0].name).toBe('testCompany');
  });
  // Testing for failure if no company is found
  test('Responds with 500 if no company is found', async function() {
    const response = await request(app).get(`/companies?min_employees=101`);
    expect(response.statusCode).toBe(500);
  });
});

// TESTING route to find a company with max employee count of query
describe('GET /companies/max_employees', async function() {
  test('gets specific company(s) with query of max_employees', async function() {
    const response = await request(app).get(`/companies?max_employees=101`);
    expect(response.statusCode).toBe(200);
    expect(response.body.companies[0].name).toBe('testCompany');
  });
  // Testing for failure if no company is found
  test('Responds with 500 if no company is found', async function() {
    const response = await request(app).get(`/companies?max_employees=99`);
    expect(response.statusCode).toBe(500);
  });
});

// TESTING route for both min and max employee count filter
describe('GET /companies/min_employees&max_employees', async function() {
  test('gets specific company(s) with query of both min and max_employees', async function() {
    const response = await request(app).get(
      `/companies?min_employees=99&max_employees=101`
    );
    expect(response.statusCode).toBe(200);
    expect(response.body.companies[0].name).toBe('testCompany');
  });
  // Testing for failure if user error - min > max employee count
  test('Responds with 400 if query params are incorrect', async function() {
    const response = await request(app).get(
      `/companies?min_employees=101&max_employees=99`
    );
    expect(response.statusCode).toBe(400);
  });
});

// TESTING route for getting specific company with a handle
describe('GET /companies/handle', async function() {
  test('gets specific company with specific handle', async function() {
    const response = await request(app).get(`/companies/testHandle`);
    expect(response.statusCode).toBe(200);
    expect(response.body.company.name).toBe('testCompany');
  });
  // Testing for failures if no company is found with the search query
  test('Responds with 500 if no company is found', async function() {
    const response = await request(app).get(`/companies/BADHANDLE`);
    expect(response.statusCode).toBe(500);
  });
});

/***************** END OF GET companies tests *****************/

// POST /companies - create company from data; return {company: companyData}
describe('POST /companies', async function() {
  test('creates a new company', async function() {
    const response = await request(app)
      .post(`/companies`)
      .send({
        handle: 'banana',
        name: 'bananaCompany',
        num_employees: 500,
        description: 'this is bananas',
        logo_url: 'https://bananalogo.com'
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.company.name).toBe('bananaCompany');
    expect(response.body.company.handle).toBe('banana');
    expect(response.body.company.num_employees).toBe(500);
    expect(response.body.company.description).toBe('this is bananas');
    // JSON schema validator will validate for bad user data
  });
  test('Responds with 409 if handle is not unique', async function() {
    const response = await request(app)
      .post(`/companies`)
      .send({ handle: 'testHandle' });
    expect(response.statusCode).toBe(409);
  });
});

// PATCH /companies - updates company from specific handle provided in url, return {company: companyData}
describe('PATCH /companies', async function() {
  test('updates a company', async function() {
    const response = await request(app)
      .patch(`/companies/testHandle`)
      .send({
        handle: 'testHandle',
        name: 'bananaCompany',
        num_employees: 1000,
        description: 'this is updated',
        logo_url: 'https://bananalogo.com'
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.company.name).toBe('bananaCompany');
    expect(response.body.company.num_employees).toBe(1000);
    expect(response.body.company.description).toBe('this is updated');
    // JSON schema validator will validate for bad user data
  });
  test('Responds with 404 if no company is found', async function() {
    const response = await request(app).patch(`/companies/BADHANDLE`);
    expect(response.statusCode).toBe(404);
  });
});

// DELETE /companies - deletes a company with matching handle provided returning {message: "Company deleted"}
describe('DELETE /companies', async function() {
  test('deletes a company', async function() {
    const response = await request(app).delete(`/companies/testHandle`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ message: 'Company deleted' });
  });
});
/***************** END OF POST/PATCH/DELETE companies tests *****************/

// Tear Down - removes records from test DB
afterEach(async function() {
  await db.query('DELETE FROM COMPANIES');
});

afterAll(async function() {
  await db.end();
});
