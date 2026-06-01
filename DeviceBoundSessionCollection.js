import { DeviceBoundSession } from './DeviceBoundSession.js';

/**
 * TODO: persistence
 */
class DeviceBoundSessionCollection {
  constructor() {
    this.collection = new Map();
  }

  /**
   * @param {string} id 
   * @returns {DeviceBoundSession | null}
   */
  async get(id) {
    return this.collection.get(id);
  }

  /**
   * 
   * @param {string} id 
   * @param {DeviceBoundSession} session 
   * @returns 
   */
  async set(id, session) {
    return this.collection.set(id, session);
  }
}

export { DeviceBoundSessionCollection };
