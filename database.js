// Creating as database using SQLite
// A users file will be created in the same directory on its own

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'users.db');

class Database {
  constructor() {
    this.db = null;
  }

  // Opening database connection and returning a promise arrow function that resolves when connected
  connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // Closes the database connection
  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  // Create a new user (templated queries will follow for the rest of the functions)
  createUser(username, email, passwordHash) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO users (username, email, password_hash)
        VALUES (?, ?, ?)
        `;
      
      this.db.run(query, [username, email, passwordHash], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, username, email });
        }
      });
    });
  }

  // Find user by email
  findUserByEmail(email) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM users WHERE email = ?
      `;
      
      this.db.get(query, [email], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Find user by username
  findUserByUsername(username) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM users WHERE username = ?
      `;
      
      this.db.get(query, [username], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Find user by ID
  findUserById(id) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM users WHERE id = ?
      `;
      
      this.db.get(query, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }
}

module.exports = Database;