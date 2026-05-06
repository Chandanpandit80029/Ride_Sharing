const { sendError } = require('../utils/response.utils');

/**
 * 404 handler – must be placed after all valid routes.
 */
const notFound = (req, _res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Central error handler.
 * Handles Prisma errors, JWT errors, Zod errors, and generic errors.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  // Always log full details server-side
  console.error('🔴 Error:', {
    message : err.message,
    code    : err.code,
    path    : req.path,
    method  : req.method,
    stack   : process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // ── Prisma known-request errors ────────────────────────────────────────────
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    return sendError(res, 409, `${field} already exists`);
  }
  if (err.code === 'P2025') return sendError(res, 404, 'Record not found');
  if (err.code === 'P2003') return sendError(res, 400, 'Related record not found');
  if (err.code === 'P2014') return sendError(res, 400, 'Invalid relation');
  if (err.code === 'P2016') return sendError(res, 400, 'Query interpretation error');
  if (err.code === 'P2021') return sendError(res, 500, 'Database table not found — run migrations');
  if (err.code === 'P2024') return sendError(res, 503, 'Database connection timed out');

  // ── JWT ────────────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') return sendError(res, 401, 'Invalid token');
  if (err.name === 'TokenExpiredError') return sendError(res, 401, 'Token expired. Please login again.');
  if (err.name === 'NotBeforeError')    return sendError(res, 401, 'Token not yet active');

  // ── Zod validation errors (should be caught in validate middleware,
  //    but this is a safety net) ───────────────────────────────────────────────
  if (err.name === 'ZodError') {
    const errors = err.errors.map((e) => ({
      field  : e.path.join('.'),
      message: e.message,
    }));
    return sendError(res, 400, 'Validation failed', errors);
  }

  // ── Application errors with explicit statusCode ────────────────────────────
  const statusCode = err.statusCode || err.status || 500;
  const message =
    statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message;

  return sendError(res, statusCode, message);
};

module.exports = { notFound, errorHandler };
