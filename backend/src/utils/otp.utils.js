const crypto = require('crypto');

/**
 * Generate a 6-digit cryptographically-random OTP.
 */
const generateOTP = () => {
  const buffer = crypto.randomBytes(3);
  const number = buffer.readUIntBE(0, 3) % 1_000_000;
  return String(number).padStart(6, '0');
};

/**
 * Return a Date `minutes` from now.
 */
const getOTPExpiry = (minutes = 5) =>
  new Date(Date.now() + minutes * 60 * 1_000);

/**
 * Return true if the OTP record is expired.
 */
const isOTPExpired = (expiresAt) => new Date() > new Date(expiresAt);

module.exports = { generateOTP, getOTPExpiry, isOTPExpired };
