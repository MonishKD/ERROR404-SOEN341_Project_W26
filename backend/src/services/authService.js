// authService.js
//This file contains the logic for logging a user in

async function login(userId, password) {
  // TODO: replace with DB query
  // 1) find user by userId
  // 2) compare password hash
  // 3) return token

  // Temporary response for Sprint 1 demo
  return { token: "demo-token", user: { userId } };
}

module.exports = { login };
