import { ZodError } from 'zod';

/**
 * Higher-order middleware for validating incoming Express requests using Zod schemas.
 * @param {Object} schema - Object containing Zod schemas for body, query, and/or params
 */
export const validateRequest = (schema) => async (req, res, next) => {
  try {
    if (schema.body) {
      req.body = await schema.body.parseAsync(req.body);
    }
    if (schema.query) {
      req.query = await schema.query.parseAsync(req.query);
    }
    if (schema.params) {
      req.params = await schema.params.parseAsync(req.params);
    }
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return res.status(400).json({
        error: 'Ошибка валидации данных',
        details: formattedErrors,
      });
    }
    next(error);
  }
};
