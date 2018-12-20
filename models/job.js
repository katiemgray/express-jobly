//Job model for job.ly

const db = require('../db');
const app = require('../app');
const sqlForPartialUpdate = require('../helpers/partialUpdate');

class Job {
  // This method creates a new job for our jobs table, returning the new job record
  static async create({ title, salary, equity, company_handle }) {
    const result = await db.query(
      `INSERT INTO jobs (title, salary, equity, company_handle) VALUES ($1, $2, $3, $4) RETURNING *`,
      [title, salary, equity, company_handle]
    );
    return result.rows[0];
  }

  // This method searches for jobs based on query string, or returns all jobs
  static async getJobs(queryString) {
    let results;

    if (Object.keys(queryString).length === 0) {
      // Returns handles and names for all companies
      results = await db.query(
        `SELECT title, company_handle FROM jobs ORDER BY date_posted DESC`
      );
    }
    // ******************come back to this after lunch
    if (queryString.search) {
      // Returns handles and names for companies where search string matches handle or name
      results = await db.query(
        `SELECT handle, name FROM companies WHERE handle LIKE $1 or name LIKE $1`,
        [queryString.search]
      );
    }
    // if there are multiple query string params, add more WHERE clauses joined by and AND
    if (queryString.min_employees) {
      /** Returns companies with a minimum employee count > queryString */
      results = await db.query(
        `SELECT name, handle FROM companies WHERE num_employees > $1`,
        [queryString.min_employees]
      );
    }
    if (queryString.max_employees) {
      /** Returns companies with a maximum employee count < queryString */
      results = await db.query(
        `SELECT name, handle FROM companies WHERE num_employees < $1`,
        [queryString.max_employees]
      );
    }

    if (queryString.max_employees && queryString.min_employees) {
      /** checks if min > max */
      if (
        Number(queryString.min_employees) > Number(queryString.max_employees)
      ) {
        let error = new Error(`Min employees exceeds max employees.`);
        error.status = 400;
        throw error;
      }
    }

    // // This will catch errors if there are no results
    // if (results.rows.length === 0) {
    //   throw new Error(`No company found :(`);
    // }

    return results.rows;
    // End of getJobs static method
  }

  // end of Job class
}

module.exports = Job;
