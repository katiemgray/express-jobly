//Company model for job.ly

const db = require('../db');
const app = require('../app');
const sqlForPartialUpdate = require('../helpers/partialUpdate');

class Company {
  /** getCompanies returns handle and name for all companies, also allows for specific query string params*/
  static async getCompanies(queryString) {
    let results;

    if (Object.keys(queryString).length === 0) {
      // Returns handles and names for all companies
      results = await db.query(`SELECT name, handle FROM companies`);
    }
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
    // End of getCompanies static method
  }

  // This method creates a new record for our company table, returning the new company record
  static async create({ handle, name, num_employees, description, logo_url }) {
    try {
      const result = await db.query(
        `INSERT INTO companies (handle, name, num_employees, description, logo_url) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [handle, name, num_employees, description, logo_url]
      );
      return result.rows[0];
    } catch (error) {
      error.status = 409;
      error.message = 'Company with that handle already exists :(';
      throw error;
    }
  }

  // getCompanyByHandle returns a single company found by its unique handle
  static async getCompanybyHandle(handle) {
    const result = await db.query(`SELECT * FROM companies WHERE handle=$1`, [
      handle
    ]);
    // This will catch errors if there are no results
    if (result.rows.length === 0) {
      throw new Error(`No company found with that handle :(`);
    }
    return result.rows[0];
  }

  // update should update a company with user provided data
  static async update({ handle, name, num_employees, description, logo_url }) {
    // use sql for partialUpdate - pattern match table name, fields, primary key, and value of primary key
    // use test to figure out if we have refactored correctly
    let items = { handle, name, num_employees, description, logo_url };
    let createdSQL = sqlForPartialUpdate(
      'companies',
      items,
      'handle',
      items.handle
    );

    const result = await db.query(createdSQL.query, createdSQL.values);

    if (result.rows.length === 0) {
      throw new Error(`No company could be updated, no company found :(`);
    }
    return result.rows[0];
  }

  // delete should remove a company in the database
  static async delete(handle) {
    const result = await db.query(
      `DELETE FROM companies WHERE handle=$1 RETURNING *`,
      [handle]
    );
    if (result.rows.length === 0) {
      throw new Error(`Company doesn't exist, or already deleted? :(`);
    }
    return result.rows[0];
  }

  // End of company class
}

module.exports = Company;
