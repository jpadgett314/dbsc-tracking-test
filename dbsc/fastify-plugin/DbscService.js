import { SessionCollection } from '../SessionCollection.js';
import { composeReply } from './reply/compose.js';
import { classifyRequest } from './request/classify.js';
import { resolveSession } from './request/resolveSession.js';

class DbscService {
  constructor(config) {
    this.sessions = new SessionCollection();
    this.config = config;
  }

  /**
   * Handles and responds to any DBSC-related command
   */
  handle(request, reply) {
    const session = resolveSession(request, this.config);
    const requestType = classifyRequest(request, session, this.config);
    const replyType = session.updateMode(requestType);

    return composeReply(replyType, reply, session, this.config);
  }  
}

export { DbscService };
