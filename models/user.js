//User model for job.ly

const db = require('../db');
const app = require('../app');
const sqlForPartialUpdate = require('../helpers/partialUpdate');

class User {
  // This method creates a new user for our users table, returning the new user record
  static async create({
    username,
    password,
    first_name,
    last_name,
    email,
    photo_url,
    is_admin
  }) {
    try {
      const result = await db.query(
        `INSERT INTO users (username, password, first_name, last_name, email, photo_url, is_admin) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [username, password, first_name, last_name, email, photo_url, is_admin]
      );
      return result.rows[0];
    } catch (error) {
      error.status = 409;
      error.message = 'Username already exists :(';
      throw error;
    }
  }

  static async getUsers() {
    // Returns username, firstname, lastname, email for all users
    let results = await db.query(
      `SELECT username, first_name, last_name, email FROM users`
    );
    if (results.rows.length === 0) {
      throw new Error(`No users found :(`);
    }
    return results.rows;
  }

  //end of USER class
}
module.exports = User;
