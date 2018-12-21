// Users routes

const express = require('express');
const router = express.Router();
const Job = require('../models/job');
const db = require('../db');
const { validate } = require('jsonschema');
const userSchema = require('../schemas/userSchema.json');
const APIError = require('../helpers/APIError');
const User = require('../models/user');

// Route to get all users
router.get('/', async function(req, res, next) {
  try {
    let users = await User.getUsers();
    return res.json({ users });
  } catch (err) {
    err.status = 400;
    return next(err);
  }
});

// This route adds a new user into our database, returning {user: user}

router.post('/', async function(req, res, next) {
  const result = validate(req.body, userSchema);
  if (!result.valid) {
    // pass validation errors to error handler
    let message = result.errors.map(error => error.stack);
    let status = 400;
    let error = new APIError(message, status);
    return next(error);
  }
  // at this point in code, we know we have a valid payload
  try {
    const {
      username,
      password,
      first_name,
      last_name,
      email,
      photo_url,
      is_admin
    } = req.body;
    const user = await User.create(req.body);
    return res.json({ user });
  } catch (error) {
    error.status = 409;
    return next(error);
  }
});

// end of user routes
module.exports = router;
