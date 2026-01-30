// This file is used to initialize the database and create the users table

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const DB_PATH = path.join(__dirname, 'users.db');

// Create and initialize the database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
  console.log('Connected to the SQLite database.');
});

// Create users table
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating users table:', err.message);
    } else {
      console.log('Users table created successfully.');
    }
  });

  // Create index on email for faster lookups
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_users_email 
    ON users(email)
  `, (err) => {
    if (err) {
      console.error('Error creating email index:', err.message);
    } else {
      console.log('Email index created successfully.');
    }
  });

  // Create index on username {}
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_users_username 
    ON users(username)
  `, (err) => {
    if (err) {
      console.error('Error creating username index:', err.message);
    } else {
      console.log('Username index created successfully.');
    }
  });
});

// Close the database connection
db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
  } else {
    console.log('Database connection closed.');
  }
});