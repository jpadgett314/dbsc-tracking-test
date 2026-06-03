import { locks } from 'web-locks';
import { Session } from '../Session.js';
import { SessionCollection } from '../SessionCollection.js';
import { composeReply } from './reply/compose.js';
import { classifyRequest } from './request/classify.js';

/** @typedef {import('fastify').FastifyRequest} FastifyRequest */

class DbscService {
  constructor(config) {
    this.sessions = new SessionCollection();
    this.config = config;
  }

  /**
   * @param {SessionCollection} sessions
   * @param {FastifyRequest} request 
   * @param {object} config 
   * @returns {Session}
   */
  async resolveSession(request) {
    const cookieId = request.cookies[this.config.cookie.name];
    const headerId = request.headers['sec-secure-session-id'];

    let session = await this.sessions.get(cookieId || headerId);
    if (!session) {
      session = Session.fromDefaults();
      this.sessions.set(session.id, session);
    }
    return session;
  }

  /**
   * Handles and responds to any DBSC-related command
   * @param {FastifyRequest} request 
   */
  async handle(request, reply) {
    let session = null;

    await locks.request('session-lookup', async () => {
      session = await this.resolveSession(request);
    });

    await locks.request(session.id, async (lock) => {
      const requestType = await classifyRequest(request, session, this.config);
      const replyType = session.updateMode(requestType);
      composeReply(replyType, reply, session, this.config);
    });
  }  
}

export { DbscService };
