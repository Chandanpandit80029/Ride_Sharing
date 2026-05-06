const bcrypt = require('bcryptjs');
const prisma  = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response.utils');
const { BCRYPT_ROUNDS }          = require('../config/constants');

// ─── GET /profile ─────────────────────────────────────────────────────────────
const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where : { id: req.user.id },
      select: {
        id        : true,
        name      : true,
        rollNo    : true,
        email     : true,
        phone     : true,
        domain    : true,
        isVerified: true,
        createdAt : true,
        _count    : {
          select: {
            rides       : true,
            sentRequests: true,
          },
        },
      },
    });
    if (!user) return sendError(res, 404, 'User not found');
    sendSuccess(res, 200, 'Profile fetched', { user });
  } catch (e) { next(e); }
};

// ─── PATCH /profile ───────────────────────────────────────────────────────────
// Zod validation happens in route via validate(updateProfileSchema)
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const updateData = {};
    if (name  !== undefined) updateData.name  = name;
    if (phone !== undefined) updateData.phone = phone; // null clears it

    const user = await prisma.user.update({
      where : { id: req.user.id },
      data  : updateData,
      select: { id: true, name: true, rollNo: true, email: true, phone: true, domain: true },
    });
    sendSuccess(res, 200, 'Profile updated successfully', { user });
  } catch (e) { next(e); }
};

// ─── PATCH /profile/change-password ──────────────────────────────────────────
// Zod validation happens in route via validate(changePasswordSchema)
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user    = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return sendError(res, 400, 'Current password is incorrect');

    const hashed = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });

    // Revoke all refresh tokens to force re-login everywhere
    await prisma.refreshToken.updateMany({
      where: { userId: req.user.id },
      data : { isRevoked: true },
    });

    sendSuccess(res, 200, 'Password changed successfully. Please login again.');
  } catch (e) { next(e); }
};

module.exports = { getProfile, updateProfile, changePassword };
