/**
 * Given a ride's date (Date | string) and time (string "HH:MM"),
 * return a Date representing the exact departure moment.
 *
 * This is needed because Prisma stores date as midnight UTC but the
 * actual departure time is stored separately as a string.
 */
const getRideDepartureDate = (date, time) => {
  const base = new Date(date);

  // Parse "HH:MM"
  const [hours, minutes] = (time || '00:00').split(':').map(Number);

  // Build a new Date at the correct local time
  const departure = new Date(base);
  departure.setHours(hours, minutes, 0, 0);

  return departure;
};

/**
 * Return true if the ride departure has already passed.
 */
const isRideExpired = (date, time) => {
  return getRideDepartureDate(date, time) < new Date();
};

module.exports = { getRideDepartureDate, isRideExpired };
