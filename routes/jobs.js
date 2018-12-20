// Jobs routes

const express = require('express');
const router = express.Router();
const Job = require('../models/job');
const db = require('../db');
const { validate } = require('jsonschema');
const jobSchema = require('../schemas/jobSchema.json');
const APIError = require('../helpers/APIError');
const Company = require('../models/company');

// This route adds a new job into our database, returning {job: jobData}
// TO DO : Make job Schema in jsonschema.net
router.post('/', async function(req, res, next) {
  const result = validate(req.body, jobSchema);
  if (!result.valid) {
    // pass validation errors to error handler
    let message = result.errors.map(error => error.stack);
    let status = 400;
    let error = new APIError(message, status);
    return next(error);
  }
  // at this point in code, we know we have a valid payload
  try {
    // Check if company exists first before database breaks
    await Company.getCompanybyHandle(req.body.company_handle);
    const { title, salary, equity, company_handle } = req.body;
    const job = await Job.create(req.body);
    return res.json({ job });
  } catch (error) {
    error.status = 400;
    return next(error);
  }
});

// End of jobs routes
module.exports = router;
