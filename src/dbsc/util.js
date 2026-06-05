import crypto from 'crypto';
import { exportJWK, importJWK } from 'jose';

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

/**
 * @param {CryptoKey} key
 * @returns {import('jose').JWK}
 */
async function serializePubkey(key) {
  return exportJWK(key);
}

/**
 * @param {import('jose').JWK} jwk 
 * @return {CryptoKey}
 */
async function deserializePubkey(jwk) {
  return importJWK(jwk);
}
 
export { generateChallenge, generateSessionId, serializePubkey, deserializePubkey };
