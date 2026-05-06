const rateLimit = require('express-rate-limit');

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000; // 15 min

/**
 * General API rate limiter — applied globally.
 */
const globalLimiter = rateLimit({
  windowMs,
  max             : parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  standardHeaders : true,
  legacyHeaders   : false,
  message         : { success: false, message: 'Too many requests. Please try again later.' },
});

/**
 * Strict limiter for OTP send — max 5 requests per 15 minutes per IP.
 * Prevents OTP spam / enumeration attacks.
 */
const otpLimiter = rateLimit({
  windowMs,
  max             : parseInt(process.env.OTP_RATE_LIMIT_MAX, 10) || 5,
  standardHeaders : true,
  legacyHeaders   : false,
  message         : { success: false, message: 'Too many OTP requests. Please wait before trying again.' },
});

/**
 * Auth limiter — login / register / reset-password.
 * Max 10 attempts per 15 minutes per IP.
 */
const authLimiter = rateLimit({
  windowMs,
  max             : 10,
  standardHeaders : true,
  legacyHeaders   : false,
  message         : { success: false, message: 'Too many authentication attempts. Please try again later.' },
});

module.exports = { globalLimiter, otpLimiter, authLimiter };
