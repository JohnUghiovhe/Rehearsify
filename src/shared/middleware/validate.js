import { ZodError } from "zod";

export default function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      if (source === 'query') {
        const parsed = schema.parse(req.query);
        Object.defineProperty(req, 'query', {
          value: parsed,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      } else {
        req.body = schema.parse(req.body);
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