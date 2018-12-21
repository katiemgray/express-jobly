// Jobs routes

const express = require('express');
const router = express.Router();
const Job = require('../models/job');
const db = require('../db');
const { validate } = require('jsonschema');
const jobSchema = require('../schemas/jobSchema.json');
const APIError = require('../helpers/APIError');
const Company = require('../models/company');
const {
  ensureLoggedIn,
  ensureCorrectUser,
  ensureAdmin
} = require('../middleware/auth');

// If the query string parameter is passed, a filtered list of handles and titles.
// Handles should be displayed based on the search term and if the name includes it.
router.get('/', ensureLoggedIn, async function(req, res, next) {
  try {
    let jobs = await Job.getJobs(req.query);
    return res.json({ jobs });
  } catch (err) {
    err.status = 400;
    return next(err);
  }
});

// This route adds a new job into our database, returning {job: jobData}
router.post('/', ensureAdmin, async function(req, res, next) {
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

// This route should return a single job found by its id.
// It should return a JSON of {job: jobData}
router.get('/:id', ensureLoggedIn, async function(req, res, next) {
  try {
    let job = await Job.getJobById(req.params.id);
    return res.json({ job });
  } catch (err) {
    err.status = 404;
    return next(err);
  }
});

// This route should update a single job by the id provided.
// It should return a JSON of {job: jobData}
router.patch('/:id', ensureAdmin, async function(req, res, next) {
  const result = validate(req.body, jobSchema);
  if (!result.valid) {
    // pass validation errors to error handler
    let message = result.errors.map(error => error.stack);
    let status = 400;
    let error = new APIError(message, status);
    return next(error);
  }
  // at this point in code, we know we have a valid payload
  const id = req.params.id;

  const { title, salary, equity, company_handle } = req.body;

  try {
    const job = await Job.update({
      id,
      title,
      salary,
      equity,
      company_handle
    });
    return res.json({ job });
  } catch (err) {
    err.status = 404;
    return next(err);
  }
});

// This route should remove a job by the id provided.
// Should return a JSON of {message: "Job deleted"}
router.delete('/:id', ensureAdmin, async function(req, res, next) {
  try {
    await Job.delete(req.params.id);
    return res.json({ message: 'Job deleted' });
  } catch (err) {
    err.status = 404;
    return next(err);
  }
});

// End of jobs routes
module.exports = router;
