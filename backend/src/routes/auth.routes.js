const express = require('express');
const router  = express.Router();

const {
  sendOTP, verifyOTP, register, login, refreshToken, logout,
  forgotPassword, resetPassword, getMe,
} = require('../controllers/auth.controller');
const { protect }  = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { otpLimiter, authLimiter } = require('../middleware/rateLimit.middleware');
const {
  sendOTPSchema, verifyOTPSchema, registerSchema, loginSchema,
  refreshTokenSchema, logoutSchema, forgotPasswordSchema, resetPasswordSchema,
} = require('../validations/auth.validation');

// ── Public routes ─────────────────────────────────────────────────────────────
router.post('/send-otp',        otpLimiter,  validate(sendOTPSchema),        sendOTP);
router.post('/verify-otp',      otpLimiter,  validate(verifyOTPSchema),      verifyOTP);
router.post('/register',        authLimiter, validate(registerSchema),        register);
router.post('/login',           authLimiter, validate(loginSchema),           login);
router.post('/refresh',                      validate(refreshTokenSchema),    refreshToken);
router.post('/logout',                       validate(logoutSchema),          logout);
router.post('/forgot-password', otpLimiter,  validate(forgotPasswordSchema),  forgotPassword);
router.post('/reset-password',  authLimiter, validate(resetPasswordSchema),   resetPassword);

// ── Protected routes ──────────────────────────────────────────────────────────
router.get('/me', protect, getMe);

module.exports = router;
