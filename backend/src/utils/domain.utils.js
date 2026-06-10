/**
 * Extract the domain part from an email address.
 * @param {string} email
 * @returns {string|null}
 */
const extractDomain = (email) => {
  if (!email || !email.includes('@')) return null;
  return email.split('@')[1].toLowerCase();
};

/**
 * Return true if the email belongs to one of the allowed college domains.
 * Reads ALLOWED_DOMAINS env var (comma-separated list).
 */
const isAllowedDomain = (email) => {
  const domain  = extractDomain(email);
  if (!domain)  return false;

  const allowed = (process.env.ALLOWED_DOMAINS || 'nitkkr.ac.in' || 'gmail.com')
    .split(',')
    .map((d) => d.trim().toLowerCase());

  return allowed.includes(domain);
};

module.exports = { extractDomain, isAllowedDomain };
