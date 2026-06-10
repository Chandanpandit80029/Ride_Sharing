const {
  sendOTPService,
  verifyOTPService,
  registerService,
  loginService,
  refreshTokenService,
  logoutService,
  forgotPasswordService,
  resetPasswordService,
} = require('../services/auth.service');
const { sendSuccess } = require('../utils/response.utils');

const sendOTP = async (req, res, next) => {
  try {
    const result = await sendOTPService(req.body.email, req.body.name);
    sendSuccess(res, 200, result.message);
  } catch (e) { next(e); }
};

const verifyOTP = async (req, res, next) => {
  try {
    const result = await verifyOTPService(req.body.email, req.body.otp);
    sendSuccess(res, 200, 'OTP verified successfully. You may now complete registration.', result);
  } catch (e) { next(e); }
};

const register = async (req, res, next) => {
  try {
    const registerPayload = {
      ...req.body,
      profilePic: req.file?.filename,
    };
    const result = await registerService(registerPayload);
    sendSuccess(res, 201, 'Account created successfully', result);
  } catch (e) { next(e); }
};

const login = async (req, res, next) => {
  try {
    const result = await loginService(req.body.email, req.body.password);
    sendSuccess(res, 200, 'Login successful', result);
  } catch (e) { next(e); }
};

const refreshToken = async (req, res, next) => {
  try {
    const tokens = await refreshTokenService(req.body.refreshToken);
    sendSuccess(res, 200, 'Token refreshed successfully', tokens);
  } catch (e) { next(e); }
};

const logout = async (req, res, next) => {
  try {
    const result = await logoutService(req.body.refreshToken);
    sendSuccess(res, 200, result.message);
  } catch (e) { next(e); }
};

const forgotPassword = async (req, res, next) => {
  try {
    const result = await forgotPasswordService(req.body.emailOrPhone);
    sendSuccess(res, 200, result.message);
  } catch (e) { next(e); }
};

const resetPassword = async (req, res, next) => {
  try {
    const result = await resetPasswordService(
      req.body.email,
      req.body.otp,
      req.body.newPassword
    );
    sendSuccess(res, 200, result.message);
  } catch (e) { next(e); }
};

const getMe = async (req, res) => {
  sendSuccess(res, 200, 'Profile fetched', { user: req.user });
};

module.exports = {
  sendOTP,
  verifyOTP,
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
};
