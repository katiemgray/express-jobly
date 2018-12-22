/** Integration tests for companies route */

process.env.NODE_ENV = 'test';

const request = require('supertest');

const app = require('../../app');
const db = require('../../db');
const bcrypt = require('bcrypt');

let auth = {};

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

  let jobResult = await db.query(`INSERT INTO 
  jobs (id, title, salary, equity, company_handle)   
  VALUES(
    '1', 
    'testJobTitle', 
    11.11, 
    '0.11', 
    'testHandle') RETURNING *`);

  let hashedPassword = await bcrypt.hash('12345', 1);

  let userResult = await db.query(
    `
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
          $1,
          'testFirstName',
          'testLastName',
          'test@test.com',
          'https://www.photo.com',
          'true') RETURNING *`,
    [hashedPassword]
  );

  const response = await request(app)
    .post('/users/login')
    .send({ username: 'testUsername', password: '12345' });
  auth.token = response.body.token;

  let companies = result.rows[0];
});

// TODO test explicitly how many companies are getting back -
// expect(req.body.companies.toHavelength(1))

// TESTING route for getting all companies
describe('GET /companies', async function() {
  test('gets all companies', async function() {
    const response = await request(app)
      .get(`/companies`)
      .send({ _token: auth.token });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('companies');
  });
  // Testing for no results from query
  test('Responds with 200 if no company is found in the database', async function() {
    await db.query('DELETE FROM companies');
    const response = await request(app)
      .get(`/companies`)
      .send({ _token: auth.token });
    expect(response.statusCode).toBe(200);
    expect(response.body.companies).toEqual([]);
  });
});

describe('GET query string params', async function() {
  // TESTING route for getting specific companies with a search query
  describe('GET /companies?search', async function() {
    test('gets specific company(s) with query of name or handle', async function() {
      const response = await request(app)
        .get(`/companies?search=testCompany`)
        .send({ _token: auth.token });
      expect(response.statusCode).toBe(200);
      expect(response.body.companies[0].name).toBe('testCompany');
    });
    // Testing for no results from query
    test('Responds with 200 if no company is found', async function() {
      const response = await request(app)
        .get(`/companies?search=BADSEARCH`)
        .send({ _token: auth.token });
      expect(response.statusCode).toBe(200);
      expect(response.body.companies).toEqual([]);
    });
  });

  // TESTING route to find a company with min employee count of query
  describe('GET /companies?min_employees', async function() {
    test('gets specific company(s) with query of min_employees', async function() {
      const response = await request(app)
        .get(`/companies?min_employees=99`)
        .send({ _token: auth.token });
      expect(response.statusCode).toBe(200);
      expect(response.body.companies[0].name).toBe('testCompany');
    });
    // Testing for no results from query
    test('Responds with 200 if no company is found', async function() {
      const response = await request(app)
        .get(`/companies?min_employees=101`)
        .send({ _token: auth.token });
      expect(response.statusCode).toBe(200);
      expect(response.body.companies).toEqual([]);
    });
  });

  // TESTING route to find a company with max employee count of query
  describe('GET /companies?max_employees', async function() {
    test('gets specific company(s) with query of max_employees', async function() {
      const response = await request(app)
        .get(`/companies?max_employees=101`)
        .send({ _token: auth.token });
      expect(response.statusCode).toBe(200);
      expect(response.body.companies[0].name).toBe('testCompany');
    });
    // Testing for no results from query
    test('Responds with 200 if no company of such requirements exists', async function() {
      const response = await request(app)
        .get(`/companies?max_employees=99`)
        .send({ _token: auth.token });
      expect(response.statusCode).toBe(200);
      expect(response.body.companies).toEqual([]);
    });
  });

  // TESTING route for both min and max employee count filter
  describe('GET /companies/min_employees&max_employees', async function() {
    test('gets specific company(s) with query of both min and max_employees', async function() {
      const response = await request(app)
        .get(`/companies?min_employees=99&max_employees=101`)
        .send({ _token: auth.token });
      expect(response.statusCode).toBe(200);
      expect(response.body.companies[0].name).toBe('testCompany');
    });
    // Testing for failure if user error - min > max employee count
    test('Responds with 400 if query params are incorrect', async function() {
      const response = await request(app)
        .get(`/companies?min_employees=101&max_employees=99`)
        .send({ _token: auth.token });
      expect(response.statusCode).toBe(400);
    });
  });
});

// TESTING route for getting specific company with a handle
describe('GET /companies/handle', async function() {
  test('gets specific company with specific handle', async function() {
    const response = await request(app)
      .get(`/companies/testHandle`)
      .send({ _token: auth.token });
    expect(response.statusCode).toBe(200);
    console.log(
      `Inside test for companies/handle GET, response is`,
      response.body
    );
    expect(response.body.company.name).toBe('testCompany');
  });
  // Testing for failures if no company is found with handle provided
  test('Responds with 404 if no company is found with handle provided', async function() {
    const response = await request(app)
      .get(`/companies/BADHANDLE`)
      .send({ _token: auth.token });
    expect(response.statusCode).toBe(404);
  });

  // TODO- more reqs for query string - what if they search for multiple query string params?
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
        logo_url: 'https://bananalogo.com',
        _token: auth.token
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
      .send({ handle: 'testHandle', name: 'testCompany', _token: auth.token });
    expect(response.statusCode).toBe(409);
  });
});

// PATCH /companies - updates company from specific handle provided in url, return {company: companyData}
describe('PATCH /companies/:handle', async function() {
  test('updates a company', async function() {
    const response = await request(app)
      .patch(`/companies/testHandle`)
      .send({
        handle: 'testHandle',
        name: 'bananaCompany',
        num_employees: 1000,
        description: 'this is updated',
        logo_url: 'https://bananalogo.com',
        _token: auth.token
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.company.name).toBe('bananaCompany');
    expect(response.body.company.num_employees).toBe(1000);
    expect(response.body.company.description).toBe('this is updated');
    // JSON schema validator will validate for bad user data
  });
  test('Responds with 404 if no company is found', async function() {
    const response = await request(app)
      .patch(`/companies/BADHANDLE`)
      .send({ _token: auth.token });
    expect(response.statusCode).toBe(404);
  });
});

// DELETE /companies - deletes a company with matching handle provided returning {message: "Company deleted"}
describe('DELETE /companies', async function() {
  test('deletes a company', async function() {
    const response = await request(app)
      .delete(`/companies/testHandle`)
      .send({ _token: auth.token });
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ message: 'Company deleted' });
  });
  test('Responds with 404 if no company is found', async function() {
    const response = await request(app)
      .delete(`/companies/BADHANDLE`)
      .send({ _token: auth.token });
    expect(response.statusCode).toBe(404);
  });
});
/***************** END OF POST/PATCH/DELETE companies tests *****************/

// Tear Down - removes records from test DB
afterEach(async function() {
  await db.query('DELETE FROM users');
  await db.query('DELETE FROM jobs');
  await db.query('DELETE FROM companies');
});

afterAll(async function() {
  await db.end();
});
