const db = require('../db');
const app = require('../app');
const sqlForPartialUpdate = require('../helpers/partialUpdate');

class Job {
  // This method creates a new job for our jobs table, returning the new job record
  static async create({ title, salary, equity, company_handle }) {
    try {
      const result = await db.query(
        `INSERT INTO jobs (title, salary, equity, company_handle ) VALUES ($1, $2, $3, $4) RETURNING *`,
        [title, salary, equity, company_handle]
      );
      return result.rows[0];
    } catch (error) {
      error.status = 409;
      error.message = 'Job alredy exists :(';
      throw error;
    }
  }
}

module.exports = Job;
