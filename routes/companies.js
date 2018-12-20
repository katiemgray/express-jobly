// Company routes

const express = require('express');
const router = express.Router();
const Company = require('../models/company');
const db = require('../db');
const { validate } = require('jsonschema');
const companySchema = require('../schemas/companySchema.json');
const APIError = require('../helpers/APIError');

// If the query string parameter is passed, a filtered list of handles and names.
// Handles should be displayed based on the search term and if the name includes it.
router.get('/', async function(req, res, next) {
  try {
    let companies = await Company.getCompanies(req.query);
    return res.json({ companies });
  } catch (err) {
    return next(err);
  }
});

// Currently, this route adds a new company into our database
router.post('/', async function(req, res, next) {
  const result = validate(req.body, companySchema);
  if (!result.valid) {
    // pass validation errors to error handler
    // STATUS CODE IS INCORRECT -- VALIDATION DOESNT SEEM TO BE WORKING FOR JSON SCHEMA
    let message = result.errors.map(error => error.stack);
    let status = 409;
    let error = new APIError(message, status);
    return next(error);
  }
  // at this point in code, we know we have a valid payload
  try {
    const { handle, name, num_employees, description, logo_url } = req.body;
    const company = await Company.create({
      handle,
      name,
      num_employees,
      description,
      logo_url
    });
    return res.json({ company });
  } catch (error) {
    return next(error);
  }
});

// This route should return a single company found by its handle.
// It should return a JSON of {company: companyData}
router.get('/:handle', async function(req, res, next) {
  try {
    let company = await Company.getCompanybyHandle(req.params.handle);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

// This route should update a single company by the handle provided.
// It should return a JSON of {company: companyData}
router.patch('/:handle', async function(req, res, next) {
  const result = validate(req.body, companySchema);
  if (!result.valid) {
    // pass validation errors to error handler
    let message = result.errors.map(error => error.stack);
    let status = 404;
    let error = new APIError(message, status);
    return next(error);
  }
  // at this point in code, we know we have a valid payload
  const handle = req.params.handle;
  const { name, num_employees, description, logo_url } = req.body;
  const company = await Company.update({
    handle,
    name,
    num_employees,
    description,
    logo_url
  });
  return res.json({ company });
});

// This route should remove a company by the handle provided.
// Should return a JSON of {message: "Company deleted"}
router.delete('/:handle', async function(req, res, next) {
  try {
    let company = await Company.delete(req.params.handle);
    return res.json({ message: 'Company deleted' });
  } catch (err) {
    return next(err);
  }
});

// End of company routes
module.exports = router;
