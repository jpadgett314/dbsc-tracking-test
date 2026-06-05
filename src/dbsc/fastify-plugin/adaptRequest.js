/** @typedef {import("../types.js").DBSCInputs} DBSCInputs */

async function adaptRequest(options, request) {
  /** @type {DBSCInputs} */
  const inputs = {
    route: request.routeOptions.url,
    sessionId: request.cookies[options.cookie.name],
    secureSessionResponse: request.headers['secure-session-response'],
    secureSessionId: request.headers['sec-secure-session-id'],
  };

  return inputs;
}

export { adaptRequest };
