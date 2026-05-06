const jwt = require('jsonwebtoken');

const generateAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });

const generateRefreshToken = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

const verifyAccessToken  = (token) => jwt.verify(token, process.env.JWT_SECRET);
const verifyRefreshToken = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET);

/**
 * Generate both access + refresh token pair.
 * Returns { accessToken, refreshToken, refreshExpiresAt }
 */
const generateTokenPair = (payload) => {
  const accessToken  = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Calculate refresh token expiry for DB storage
  const expiryMs       = parseDurationMs(process.env.JWT_REFRESH_EXPIRES_IN || '7d');
  const refreshExpiresAt = new Date(Date.now() + expiryMs);

  return { accessToken, refreshToken, refreshExpiresAt };
};

/**
 * Parse duration strings like '7d', '15m', '2h' into milliseconds.
 */
const parseDurationMs = (duration) => {
  const unit  = duration.slice(-1);
  const value = parseInt(duration.slice(0, -1), 10);
  const map   = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return (map[unit] || 86_400_000) * value;
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenPair,
  parseDurationMs,
};
