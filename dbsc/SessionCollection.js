import { Session } from './Session.js';

/**
 * TODO: persistence
 */
class SessionCollection {
  constructor() {
    this.collection = new Map();
  }

  /**
   * @param {string} id 
   * @returns {Session | null}
   */
  async get(id) {
    return this.collection.get(id);
  }

  /**
   * 
   * @param {string} id 
   * @param {Session} session 
   * @returns 
   */
  async set(id, session) {
    return this.collection.set(id, session);
  }
}

export { SessionCollection };
