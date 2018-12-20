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
      // Returns handles and names for all jobs
      results = await db.query(
        `SELECT title, company_handle FROM jobs ORDER BY date_posted DESC`
      );
    }

    if (queryString.search) {
      // Returns title and handle of companies where search string matches title
      results = await db.query(
        `SELECT title, company_handle FROM jobs WHERE title LIKE $1`,
        [queryString.search]
      );
      console.log('in get jobs job model, the results ', results);
    }

    if (queryString.min_salary) {
      /** Returns jobs with a minimum salary amount > queryString */
      results = await db.query(
        `SELECT title, company_handle FROM jobs WHERE salary > $1`,
        [queryString.min_salary]
      );
    }

    if (queryString.min_equity) {
      /** Returns jobs with a min equity amount > queryString */
      results = await db.query(
        `SELECT title, company_handle FROM jobs WHERE equity > $1`,
        [queryString.min_equity]
      );
    }

    return results.rows;
    // End of getJobs static method
  }

  // getJobById returns a single job found by its unique id
  static async getJobById(id) {
    const result = await db.query(`SELECT * FROM jobs WHERE id=$1`, [id]);
    // This will catch errors if there are no results
    if (result.rows.length === 0) {
      throw new Error(`No job found with that handle :(`);
    }
    return result.rows[0];
  }

  // update should update a job with user provided data
  static async update({ title, salary, equity, company_handle }) {
    // use sql for partialUpdate - pattern match table name, fields, primary key, and value of primary key

    let items = { title, salary, equity, company_handle };
    let createdSQL = sqlForPartialUpdate('jobs', items, 'id', items.id);

    const result = await db.query(createdSQL.query, createdSQL.values);

    if (result.rows.length === 0) {
      throw new Error(`No job could be updated, no company found :(`);
    }
    return result.rows[0];
  }

  // delete should remove a job in the database
  static async delete(id) {
    const result = await db.query(`DELETE FROM jobs WHERE id=$1 RETURNING *`, [
      id
    ]);
    if (result.rows.length === 0) {
      throw new Error(`Job doesn't exist, or already deleted? :(`);
    }
    return result.rows[0];
  }

  // end of Job class
}

module.exports = Job;
