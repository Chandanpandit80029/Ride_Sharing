const cron   = require('node-cron');
const prisma = require('../config/db');
const { isRideExpired } = require('../utils/rideTime.utils');

/**
 * JOB: Mark expired rides
 *
 * Runs every 5 minutes.
 * Finds rides whose departure has passed and marks them isExpired = true.
 * This is what the prompt requires:
 *   "remove ride from other user if posted ride time is over"
 * We mark instead of hard-delete to keep historical data / requests intact.
 * The GET /rides endpoint already filters these out from listings.
 *
 * Also: pending requests on expired rides are auto-rejected so requesters
 * are not left hanging.
 */
const markExpiredRides = async () => {
  try {
    // Find non-expired rides whose date is today or in the past
    const candidates = await prisma.ride.findMany({
      where: {
        isExpired: false,
        date     : { lte: new Date() }, // only look at rides from today backwards
      },
      select: { id: true, date: true, time: true },
    });

    const expiredIds = candidates
      .filter((r) => isRideExpired(r.date, r.time))
      .map((r) => r.id);

    if (expiredIds.length === 0) return;

    await prisma.$transaction([
      // Mark rides as expired
      prisma.ride.updateMany({
        where: { id: { in: expiredIds } },
        data : { isExpired: true, isFull: true },
      }),
      // Auto-reject all PENDING requests on expired rides
      prisma.request.updateMany({
        where: { rideId: { in: expiredIds }, status: 'PENDING' },
        data : { status: 'REJECTED' },
      }),
    ]);

    console.log(`🕐 [Cleanup] Marked ${expiredIds.length} ride(s) as expired and rejected pending requests.`);
  } catch (err) {
    console.error('❌ [Cleanup] markExpiredRides failed:', err.message);
  }
};

/**
 * JOB: Delete expired OTPs
 *
 * Runs every 10 minutes.
 * Removes OTP rows that are past their expiresAt timestamp.
 */
const purgeExpiredOTPs = async () => {
  try {
    const { count } = await prisma.oTP.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    if (count > 0) console.log(`🗑️  [Cleanup] Purged ${count} expired OTP(s).`);
  } catch (err) {
    console.error('❌ [Cleanup] purgeExpiredOTPs failed:', err.message);
  }
};

/**
 * JOB: Delete expired VerifiedEmail proofs
 *
 * Runs every 30 minutes.
 */
const purgeExpiredVerifiedEmails = async () => {
  try {
    const { count } = await prisma.verifiedEmail.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    if (count > 0) console.log(`🗑️  [Cleanup] Purged ${count} expired VerifiedEmail record(s).`);
  } catch (err) {
    console.error('❌ [Cleanup] purgeExpiredVerifiedEmails failed:', err.message);
  }
};

/**
 * JOB: Delete old revoked / expired refresh tokens
 *
 * Runs every day at 2 AM.
 * Keeps the refresh_tokens table lean.
 */
const purgeOldRefreshTokens = async () => {
  try {
    const { count } = await prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { isRevoked : true },
          { expiresAt : { lt: new Date() } },
        ],
      },
    });
    if (count > 0) console.log(`🗑️  [Cleanup] Purged ${count} old refresh token(s).`);
  } catch (err) {
    console.error('❌ [Cleanup] purgeOldRefreshTokens failed:', err.message);
  }
};

/**
 * Register all cron jobs.
 * Call this once from server.js after DB is connected.
 */
const initCleanupJobs = () => {
  // Every 5 minutes — mark expired rides + reject pending requests
  cron.schedule('*/5 * * * *', markExpiredRides, { name: 'mark-expired-rides' });

  // Every 10 minutes — purge expired OTPs
  cron.schedule('*/10 * * * *', purgeExpiredOTPs, { name: 'purge-otps' });

  // Every 30 minutes — purge expired VerifiedEmail records
  cron.schedule('*/30 * * * *', purgeExpiredVerifiedEmails, { name: 'purge-verified-emails' });

  // Every day at 2 AM — purge old refresh tokens
  cron.schedule('0 2 * * *', purgeOldRefreshTokens, { name: 'purge-refresh-tokens' });

  console.log('⏰ [Cleanup] Cron jobs registered');
};

module.exports = { initCleanupJobs, markExpiredRides, purgeExpiredOTPs };
