const { sendError } = require('../utils/response.utils');

/**
 * Validate request data with a Zod schema.
 *
 * @param {import('zod').ZodSchema} schema  - Zod schema to validate against
 * @param {'body'|'query'|'params'} source  - which part of the request to validate
 *
 * Usage:
 *   router.post('/rides', protect, validate(createRideSchema), createRideHandler);
 *   router.get('/rides',  protect, validate(findRideSchema, 'query'), getRidesHandler);
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field  : e.path.join('.'),
        message: e.message,
      }));
      return sendError(res, 400, 'Validation failed', errors);
    }

    // Replace the source with the parsed (and possibly coerced/defaulted) value
    req[source] = result.data;
    next();
  };
};

module.exports = { validate };
