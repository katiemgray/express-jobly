//Company model for job.ly

const db = require('../db');
const app = require('../app');

class Company {
  /** Returns handle and name for all companies, also allows for specific query string params*/
  static async getCompanies(queryString) {
    let results;

    if (queryString === undefined) {
      // Returns handles and names for all companies
      results = await db.query(`SELECT handle, name FROM companies`);
    }
    if (queryString.search) {
      console.log('why are we in search again whyyyy');
      // Returns handles and names for companies where search string matches handle or name
      results = await db.query(
        `SELECT handle, name FROM companies WHERE handle LIKE $1 or name LIKE $1`,
        [queryString.search]
      );
    }
    if (queryString.min_employees) {
      console.log('we made it into min employees');
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

      // This will catch errors if there are no results
      if (!results.rows[0]) {
        throw new Error(`No company found through ${queryString}.`);
      }
    }
    return results.rows;
    // End of company class
  }
}

module.exports = Company;
