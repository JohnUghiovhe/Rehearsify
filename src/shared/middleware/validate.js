import { ZodError } from "zod";

export default function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const target = source === 'query' ? req.query : req.body;
      const parsed = schema.parse(target);
      if (source === 'query') {
        req.query = parsed;
      } else {
        req.body = parsed;
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: {
            message: "Validation failed",
            details: err.issues.map(issue => ({
              field: issue.path.join("."),
              message: issue.message
            }))
          }
        });
      }

      next(err);
    }
  };
}