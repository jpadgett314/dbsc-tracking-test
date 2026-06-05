/**
 * "serialized" (JSON-serializable) Device-Bound Session
 * @typedef {object} SessionRecord
 * @property {string} id
 * @property {'inactive' | 'pending' | 'bound'} mode
 * @property {object} pubkey
 * @property {string | null} challenge
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
