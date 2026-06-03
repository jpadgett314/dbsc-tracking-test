import { Session } from '../../Session.js';

/** @typedef {import('fastify').FastifyRequest} FastifyRequest */

function checkAction(request, endpoints) {
  switch (request.routeOptions.url) {
    case endpoints.auth:
      return 'auth';
    case endpoints.register:
      return 'register';
    case endpoints.refresh: 
      return 'refresh';
    default:
      return 'invalid'; 
  }
}

async function checkProof(request, session) {
  const jwt = request.headers['secure-session-response'];
  if (!jwt) {
    return 'not-present';
  } else if (await session.verify(jwt)) {
    return 'valid';
  } else {
    return 'invalid';
  }
}

function checkCookie(request, cookie) {
  if (request.cookies[cookie.name]) {
    return 'present';
  } else {
    return 'not-present';
  }
};

function checkSessionId(request) {
  if (request.headers['sec-secure-session-id']) {
    return 'present';
  } else {
    return 'not-present';
  }
};

/**
 * @param {FastifyRequest} request
 * @param {Session} session
 * @param {object} config
 */
async function classifyRequest(request, session, config) {
  const descriptors = {
    action: checkAction(request, config.endpoints),
    session_id: checkCookie(request, config.cookie),
    device_bound_session_id: checkSessionId(request),
    device_bound_proof: await checkProof(request, session),
  };
  
  return descriptors;
}

export { classifyRequest };
