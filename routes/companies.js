// Company routes

const express = require('express');
const router = express.Router();
const Company = require('../models/company');
const db = require('../db');

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

module.exports = router;
