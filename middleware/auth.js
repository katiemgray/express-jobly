/** Middleware for handling req authorization for routes. */

const jwt = require('jsonwebtoken');
const SECRET = 'NEVER MAKE THIS PUBLIC IN PRODUCTION!';

/** Middleware: Requires user is logged in. */

function ensureLoggedIn(req, res, next) {
  try {
    const tokenFromBody = req.body._token;
    const token = jwt.verify(tokenFromBody, SECRET);
    // if (token !== tokenFromBody) {
    //   return next({ status: 404 });
    // }
    return next();
  } catch (err) {
    return next({ status: 401, message: 'Unauthorized' });
  }
}
// end

/** Middleware: Requires :username is logged in. */

function ensureCorrectUser(req, res, next) {
  try {
    const tokenFromBody = req.body._token;
    const token = jwt.verify(tokenFromBody, SECRET);
    if (token.username === req.params.username) {
      return next();
    } else {
      throw new Error();
    }
  } catch (err) {
    return next({ status: 401, message: 'Unauthorized' });
  }
}

/** Middleware: Requires user is an admin. */

function ensureAdmin(req, res, next) {
  try {
    const tokenFromBody = req.body._token;
    const token = jwt.verify(tokenFromBody, SECRET);
    console.log(`inside middleware for token.is_admin`, token.is_admin);
    if (token.is_admin === true) {
      return next();
    } else {
      throw new Error();
    }
  } catch (err) {
    return next({ status: 401, message: 'Unauthorized' });
  }
}
// end

module.exports = {
  ensureLoggedIn,
  ensureCorrectUser,
  ensureAdmin
};
