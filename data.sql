-- copied from express-messagely - adjust accordingly 
DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS companies;

CREATE TABLE companies (
    handle text PRIMARY KEY,
    name text NOT NULL UNIQUE,
    num_employees int,
    description text,
    logo_url text
);

CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    title text NOT NULL,
    salary FLOAT NOT NULL,
    equity FLOAT NOT NULL CHECK(equity > 1), 
    -- how do we add a constrait to equity? in jsonschema?
    company_handle text NOT NULL REFERENCES companies ON DELETE CASCADE,
    date_posted timestamp without time zone NOT NULL
);