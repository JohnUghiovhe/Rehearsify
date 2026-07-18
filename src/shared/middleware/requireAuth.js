// Verifies a JWT is present and valid, attaches the decoded user to req.user.
// Owned by the Auth & Access module (AUTH-2 in the PRD).
// Every other module's routes file imports this and applies it to protected routes.

export default function requireAuth(req, res, next) {
  // TODO: extract Bearer token from Authorization header
  // TODO: verify with jsonwebtoken, attach decoded payload to req.user
  // TODO: reject with 401 if missing/invalid — no detail on *why* it failed
  next();
}