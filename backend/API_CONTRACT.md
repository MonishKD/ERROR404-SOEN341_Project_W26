# MealMajor Sprint 1 API Contract
This document describes the agreement between the frontend and backend for Sprint 1.

It defines:
- Which API endpoints exist
- What data the frontend must send
- What responses the backend will return

## POST /api/login
Request:
{
  "userId": "string",
  "password": "string"
}

Response (200):
{
  "token": "string",
  "user": { "userId": "string" }
}

Response (401):
{
  "message": "Invalid credentials"
}

## GET /api/me
Headers:
Authorization: Bearer <token>

Response (200):
{
  "userId": "string",
  "username": "string",
  "email": "string",
  "dietPreferences": [],
  "allergies": []
}

## PUT /api/me
Headers:
Authorization: Bearer <token>

Request:
{
  "username": "newName",
  "email": "new@email.com",
  "dietPreferences": ["halal", "vegan"],
  "allergies": ["peanuts"]
}

Response (200):
{
  "message": "Profile updated"
}


## Notes for Backend Integration

- Authentication middleware is located at:
  `backend/src/middleware/auth.js`

- Any route that should only be accessible to logged-in users
  (for example `/api/me`) must import and use this middleware.

### Example usage in a route file

```js
const { authMiddleware } = require("../middleware/auth");

app.get("/api/me", authMiddleware, (req, res) => {
  // protected route
});

