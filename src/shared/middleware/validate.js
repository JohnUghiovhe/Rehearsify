import { ZodError } from "zod";

/**
 * Validates request data against a Zod schema.
 * @param {import('zod').ZodSchema} schema 
 * @param {'body' | 'query' | 'params'} target - Defaults to 'body'
 */
export default function validate(schema, target = 'body') {
  return (req, res, next) => {
    try {
      req[target] = schema.parse(req[target]);
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