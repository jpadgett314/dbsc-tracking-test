import { Session } from '../../Session.js';

/** @typedef {import('fastify').FastifyRequest} FastifyRequest */

/**
 * @param {FastifyRequest} request 
 * @param {object} config 
 * @returns {Session}
 */
function resolveSession(request, config) {
  const cookieId = request.cookies[config.cookie.name];
  const headerId = request.headers['sec-secure-session-id'];

  let session = await sessions.get(cookieId || headerId);
  if (!session) {
    session = Session.fromDefaults();
    sessions.set(session.id, session);
  }

  return session;
}

export { resolveSession };
