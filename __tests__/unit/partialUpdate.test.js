process.env.NODE_ENV = 'test';

// npm packages
// const request = require('supertest');

// app imports
// const app = require('../app');
// const db = require('../db');
// const bcrypt = require('bcrypt');
const sqlForPartialUpdate = require('../../helpers/partialUpdate');
// const jwt = require("jsonwebtoken");

describe('partialUpdate()', () => {
  it('should generate a proper partial update query with just 1 field', function() {
    const dataToQuery = sqlForPartialUpdate(
      'users',
      { firstName: 'Elie', lastName: 'Schoppik' },
      'id',
      100
    );
    console.log('dataToQuery', dataToQuery);
    // FIXME: write real tests!
    expect(dataToQuery).toEqual({
      query:
        'UPDATE users SET firstName=$1, lastName=$2 WHERE id=$3 RETURNING *',
      values: ['Elie', 'Schoppik', 100]
    });
  });
});
