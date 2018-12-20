// Jobs routes

const express = require('express');
const router = express.Router();
const Job = require('../models/job');
const db = require('../db');
const { validate } = require('jsonschema');
// const jobSchema = require('../schemas/jobSchema.json');
const APIError = require('../helpers/APIError');

// End of jobs routes
module.exports = router;
