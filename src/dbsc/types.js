/**
 * "serialized" (JSON-serializable) Device-Bound Session
 * @typedef SessionRecord
 * @param {string} id
 * @param {'inactive' | 'pending' | 'bound'} mode
 * @param {object} pubkey
 * @param {string | null} challenge
 */

/**
 * @typedef {object} DBSCInputs
 * @property {string} route
 * @property {string} sessionId
 * @property {string} secureSessionResponse
 * @property {string} secureSessionId
 */

/**
 * @typedef {object} DBSCOutputs
 * @property {string} secureSessionRegistration
 * @property {string} secureSessionChallenge
 * @property {string} setCookie
 * @property {number} status
 * @property {object} payload
 */
