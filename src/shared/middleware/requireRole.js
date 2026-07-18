// Rejects requests from users whose role isn't in the allowed list.
// Usage: router.post('/songs', requireAuth, requireRole('ADMINISTRATOR', 'CHOIR_DIRECTOR'), handler)
// Must run AFTER requireAuth, since it reads req.user.role.

export default function requireRole(...allowedRoles) {
  return (req, res, next) => {
    // TODO: check req.user exists (requireAuth ran first)
    // TODO: check req.user.role is in allowedRoles
    // TODO: reject with 403 if not
    next();
  };
}