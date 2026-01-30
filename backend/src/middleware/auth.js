// auth.js
// Purpose: allow access only to logged-in users by verifying a token (Sprint 1 simple version)

function authMiddleware(req, res, next) {
   // Read the Authorization header from the request
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid token" });
  }

  // Extract the token (remove "Bearer " from the header)
  const token = header.slice("Bearer ".length).trim();

  // TODO (Sprint2): replace with real token lookup (DB) once ready
  // Example: const user = await findUserByToken(token);

  // If token is empty, block access
  if (!token) {
    return res.status(401).json({ message: "Invalid token" });
  }

  // For now, attach token (later attach user info)
  req.token = token;

  // Token exists → allow request to continue to the route
  next();
}

// Export middleware so routes can use it
module.exports = { authMiddleware };
