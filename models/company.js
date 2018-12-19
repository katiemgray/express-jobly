//Company model for job.ly

const db = require('../db');
const app = require('../app');

class Company {
  /** Returns handle and name for all companies, also allows for specific query string params*/
  static async getCompanies(queryString) {
    let results;
    console.log(`We are in getCompanies`);
    if (!queryString) {
      // Returns handles and names for all companies
      results = await db.query(`SELECT handle, name FROM companies`);
      console.log(`At the !querystring of company model`, results);
    } else if (queryString === 'search') {
      // Returns handles and names for companies where search string matches handle or name
      results = await db.query(
        `SELECT handle, name FROM companies WHERE handle LIKE $1 or name LIKE $1`,
        [queryString]
      );
    } else if (queryString === 'min_employees') {
      /** Returns companies with a minimum employee count > queryString */
      results = await db.query(
        `SELECT name, handle FROM companies WHERE num_employees > $1`,
        [queryString]
      );
    } else if (queryString === 'max_employees') {
      /** Returns companies with a maximum employee count < queryString */
      results = await db.query(
        `SELECT name, handle FROM companies WHERE num_employees < $1`,
        [queryString]
      );
    }

    // This will catch errors if there are no results
    if (!results.rows[0]) {
      throw new Error(`No company found through ${queryString}.`);
    }
    console.log(`At the bottom of company model`, results);
    return results.rows;
  }

  // End of company class
}

module.exports = Company;
