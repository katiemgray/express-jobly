// Users routes

const express = require('express');
const router = express.Router();
const Job = require('../models/job');
const db = require('../db');
const { validate } = require('jsonschema');
const userSchema = require('../schemas/userSchema.json');
const APIError = require('../helpers/APIError');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const {
  ensureLoggedIn,
  ensureCorrectUser,
  ensureAdmin
} = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const SECRET = 'NEVER MAKE THIS PUBLIC IN PRODUCTION!';
const OPTIONS = { expiresIn: 60 * 60 }; // 1 hour

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
    await User.create(req.body);
    // After user is created in the DB, return JSON: {token: token}
    let token = jwt.sign({ username, is_admin }, SECRET, OPTIONS);
    return res.json({ token });
  } catch (error) {
    error.status = 409;
    return next(error);
  }
});

// This route authenticates a user and returns a JSON web token
// which contains a payload w/ username, and is_admin values
router.post('/login', async function(req, res, next) {
  try {
    const { username, password } = req.body;
    const result = await db.query(
      `SELECT password, is_admin FROM users WHERE username=$1`,
      [username]
    );
    const user = result.rows[0];
    const is_admin = result.rows[0].is_admin;
    if (user) {
      if (await bcrypt.compare(password, user.password)) {
        let token = jwt.sign({ username, is_admin }, SECRET, OPTIONS);
        return res.json({ token });
      }
    }
    return next({ message: 'Invalid username or password' });
  } catch (error) {
    return res.json(error);
  }
});

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

// This route should return a single user found by username.
// It should return a JSON of {user: userData}
router.get('/:username', async function(req, res, next) {
  try {
    let user = await User.getUserByUsername(req.params.username);
    return res.json({ user });
  } catch (err) {
    err.status = 404;
    return next(err);
  }
});

// This route should update a single job by the id provided.
// It should return a JSON of {job: jobData}
router.patch('/:username', ensureCorrectUser, async function(req, res, next) {
  const result = validate(req.body, userSchema);
  if (!result.valid) {
    // pass validation errors to error handler
    let message = result.errors.map(error => error.stack);
    let status = 400;
    let error = new APIError(message, status);
    return next(error);
  }
  // at this point in code, we know we have a valid payload
  const username = req.params.username;
  const { password, first_name, last_name, email, photo_url } = req.body;

  try {
    await User.getUserByUsername(username);
    const user = await User.update({
      username,
      password,
      first_name,
      last_name,
      email,
      photo_url
    });
    return res.json({
      user: {
        username,
        first_name,
        last_name,
        email,
        photo_url
      }
    });
  } catch (err) {
    err.status = 404;
    return next(err);
  }
});

// This route should remove a user by the username provided.
// Should return a JSON of {message: "User deleted"}
router.delete('/:username', ensureCorrectUser, async function(req, res, next) {
  try {
    await User.getUserByUsername(req.params.username);
    await User.delete(req.params.username);
    return res.json({ message: 'User deleted' });
  } catch (err) {
    err.status = 404;
    return next(err);
  }
});

// end of user routes
module.exports = router;
