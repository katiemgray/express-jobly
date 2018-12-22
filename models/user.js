//User model for job.ly

const db = require('../db');
const app = require('../app');
const bcrypt = require('bcrypt');
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
    const check = await db.query(
      `SELECT * FROM users WHERE username=$1 or email=$2`,
      [username, email]
    );

    if (check.rows.length > 0) {
      throw new Error('Username or email already exists :(', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 1);
    const result = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, email, photo_url, is_admin) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        username,
        hashedPassword,
        first_name,
        last_name,
        email,
        photo_url,
        is_admin
      ]
    );
    return result.rows[0];
  }

  static async getUsers() {
    // Returns username, firstname, lastname, email for all users
    let results = await db.query(
      `SELECT username, first_name, last_name, email FROM users`
    );
    // We don't need this logic, empty array is OK to return if no users are found
    // if (results.rows.length === 0) {
    //   throw new Error(`No users found :(`);
    // }
    return results.rows;
  }

  // getUserByUsername returns a single user found by its unique username
  static async getUserByUsername(username) {
    const result = await db.query(
      `SELECT username, first_name, last_name, email, photo_url FROM users WHERE username=$1`,
      [username]
    );
    // This will catch errors if there are no results
    if (result.rows.length === 0) {
      throw new Error(`No user found with that username :(`);
    }
    return result.rows[0];
  }

  // update should update a user with user provided data
  static async update({
    username,
    password,
    first_name,
    last_name,
    email,
    photo_url
  }) {
    // use sql for partialUpdate - pattern match table name, fields, primary key, and value of primary key

    let items = { username, password, first_name, last_name, email, photo_url };
    let createdSQL = sqlForPartialUpdate(
      'users',
      items,
      'username',
      items.username
    );

    const result = await db.query(createdSQL.query, createdSQL.values);

    if (result.rows.length === 0) {
      throw new Error(`No user could be updated, no company found :(`);
    }
    return result.rows[0];
  }

  // delete should remove a user in the database
  static async delete(username) {
    const result = await db.query(
      `DELETE FROM users WHERE username=$1 RETURNING *`,
      [username]
    );
    if (result.rows.length === 0) {
      throw new Error(`User doesn't exist, or already deleted? :(`);
    }
    return result.rows[0];
  }

  //end of USER class
}
module.exports = User;
