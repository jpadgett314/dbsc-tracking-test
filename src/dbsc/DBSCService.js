import { locks } from 'web-locks';
import { Session } from './Session.js';
import { SessionCollection } from './SessionCollection.js';
import { generateChallenge } from './util.js';

class DBSCService {
  /**
   * @param {object} config 
   */
  constructor(config) {
    this.sessions = new SessionCollection();
    this.config = config;
  }

  /**
   * @param {DBSCInputs} inputs 
   */
  async resolveSession(inputs) {
    /** @type {Session | null} */
    let session = null;

    await locks.request('session-resolution', async () => {
      session = await this.sessions.get(inputs.sessionId || inputs.secureSessionId);
      if (!session) {
        session = Session.generate();
        await this.sessions.set(session.id, session);
      }
    });

    return session;
  }
  
  /**
   * Central handler for auth, register and refresh
   * @param {DBSCInputs} inputs 
   * @param {Session} session
   */
  async dispatchHandler(inputs, session=null) {
    /** @type {DBSCOutputs} */
    let outputs = null;

    session ??= this.resolveSession(inputs);

    await locks.request(session.id, async () => {
      const flags = await handleInput(inputs, session, this.config);
      const outputType = session.updateMode(flags);
      outputs = handleOutput(outputType, session, this.config);
    });

    return outputs;
  }

}

async function handleInput(inputs, session, config) {
  const flags = {
    action: 'invalid',
    session_id: 'not-present',
    device_bound_proof: 'invalid',
    device_bound_session_id: 'not-present',
  };
  const jwt = inputs.secureSessionResponse;
  if (!jwt) {
    flags.device_bound_proof = 'not-present';
  } else if (await session.verify(jwt)) {
    flags.device_bound_proof = 'valid';
  }
  if (inputs.route == config.endpoints.auth) {
    flags.action = 'auth';
  } else if (inputs.route == config.endpoints.register) {
    flags.action = 'register';
  } else if (inputs.route == config.endpoints.refresh) {
    flags.action = 'refresh';
  }
  if (inputs.sessionId) {
    flags.session_id = 'present';
  }
  if (inputs.secureSessionId) {
    flags.device_bound_session_id = 'present';
  }

  return flags;
}

function handleOutput(outputType, session, config) {
  if (outputType == 'send-registration-info') {
    session.challenge = generateChallenge();
    return {
      secureSessionRegistration: 
        [
          '(ES256 RS256)',
          'path="/StartSession"',
          `origin="https://${config.host}"`,
          `challenge="${session.challenge}"`
        ].join('; '),
      setCookie: 
        [
          `${config.cookie.name}=${session.id}`,
          `Max-Age=${config.cookie.duration.long}`,
          `Secure`,
          `SameSite=Lax`,
          `Path=/`
        ].join('; '),
    }
  } else if (outputType == 'send-config') {
    return {
      setCookie: 
        [
          `${config.cookie.name}=${session.id}`,
          `Max-Age=${config.cookie.duration.short}`,
          `Secure`,
          `SameSite=Lax`,
          `Path=/`
        ].join('; '),
      payload:  
        {
          session_identifier: session.id,
          refresh_url: config.endpoints.refresh,
          scope: {
            origin: `https://${config.host}`,
            include_site: false,
            scope_specification: []
          },
          credentials: [
            {
              type: 'cookie',
              name: config.cookie.name,
              attributes: 'Secure; SameSite=Lax'
            }
          ]
        },
    }
  } else if (outputType == 'send-challenge') {
    session.challenge = generateChallenge();
    return {
      status: 403,
      secureSessionChallenge: 
        [
          `"${session.challenge}"`,
          `id="${session.id}"`,
        ].join('; '),
    }
  } else {
    console.error(`Invalid output type: ${outputType}`);
  }
}

export { DBSCService };
