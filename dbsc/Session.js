import { SessionStateMachine } from './SessionStateMachine.js';
import { SessionVerifier } from './SessionVerifier.js';
import { deserializePubkey, generateSessionId, serializePubkey } from './util.js';

/** @typedef {import('./types.js').SessionRecord} SessionRecord */

/**
 * Serializable container of Device-Bound Session state
 */
class Session {
  /**
   * @param {string} id
   * @param {SessionVerifier} verifier 
   * @param {SessionStateMachine} stateMachine 
   */
  constructor(id, verifier, stateMachine) {
    this.id = id;
    this.challenge = null;
    this.verifier = verifier;
    this.stateMachine = stateMachine;
    this.verify = t => this.verifier.verify(t, this.challenge);
    this.updateMode = (i) => this.stateMachine.transition(i);
  }

  /**
   * Construct default (unbound) Device-Bound Session
   * @returns {Session}
   */
  static fromDefaults() {
    const sessionId = generateSessionId();
    return new Session(
      sessionId,
      new SessionVerifier(null),
      new SessionStateMachine('inactive'),
    );
  }

  /**
   * @param {SessionRecord} obj 
   * @returns {Session}
   */
  static async deserialize(obj) {
    return new Session(
      obj.id, 
      new SessionVerifier(await deserializePubkey(obj.pubkey)),
      new SessionStateMachine(obj.mode)
    );
  }

  /**
   * Convert session object to JSON-serializable object
   * @returns {SessionRecord}
   */  
  async serialize() {
    return {
      id: this.id,
      mode: this.stateMachine.mode,
      pubkey: await serializePubkey(this.verifier.publicKey),
      challenge: this.challenge
    }
  }
}

export { Session };
