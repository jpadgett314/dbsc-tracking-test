import crypto from 'crypto';

/**
 * @returns {string}
 */
function generateSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * @returns {string}
 */
function generateChallenge() {
  return crypto.randomBytes(32).toString('base64url');
}

export { generateChallenge, generateSessionId };
