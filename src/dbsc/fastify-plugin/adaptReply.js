/** @typedef {import("../types.js").DBSCOutputs} DBSCOutputs */

/**
 * @param {DBSCOutputs} outputs 
 * @param {*} reply 
 * @returns {string | null}
 */
async function adaptReply(outputs, reply) {
  if (outputs.secureSessionRegistration) {
    reply.header('Secure-Session-Registration', outputs.secureSessionRegistration);
  }

  if (outputs.secureSessionChallenge) {
    reply.header('Secure-Session-Challenge', outputs.secureSessionChallenge);
  }

  if (outputs.setCookie) {
    reply.header('Set-Cookie', outputs.setCookie);
  }

  if (outputs.status) {
    reply.code(outputs.status);
  }

  if (outputs.payload) {
    return JSON.stringify(outputs.payload);
  }
}

export { adaptReply };
