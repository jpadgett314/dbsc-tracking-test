
/*
request inputs
- which endpoint? 
- cookie
- headers
- proof JWT

TRANSFORMATION: verify JWT

state machine inputs
- action
- session_id
- device_bound_session_id
- device_bound_proof

TRANSFORMATION: the state machine handles it

state machine outputs
- send-registration-info
- send-config
- send-challenge

TRANSFORMATION: registering challenge w/ session

request outputs
- registration header
- challenge header
- config object
- cookie
*/

/** @typedef {import('fastify').FastifyRequest} FastifyRequest */
/** @typedef {import('fastify').FastifyReply} FastifyReply */
import { cookie, endpoints } from './config.js';
import { DeviceBoundSession } from './DeviceBoundSession.js';
import { generateChallenge } from './helpers.js';

/**
 * @param {FastifyRequest} request
 * @param {DeviceBoundSession} session
 */
async function mapRequest(request, session) {
  const mapAction = () => {
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
  };

  const jwt = request.headers['secure-session-response'];
  const mapProof = async () => {
    if (!jwt) {
      return 'not-present';
    } else if (await session.verify(jwt)) {
      return 'valid';
    } else {
      return 'invalid';
    }
  };

  const mapCookie = () => {
    if (request.cookies[cookie.name]) {
      return 'present';
    } else {
      return 'not-present';
    }
  };

  const mapSessionId = () => {
    if (request.headers['sec-secure-session-id']) {
      return 'present';
    } else {
      return 'not-present';
    }
  };

  const state_machine_input = {
    action: mapAction(),
    session_id: mapCookie(),
    device_bound_session_id: mapSessionId(),
    device_bound_proof: await mapProof(),
  };
  
  return state_machine_input;
}

/**
 * @param {'send-registration-info' | 'send-config' | 'send-challenge'} reply_type
 * @param {FastifyReply} reply 
 * @param {DeviceBoundSession} session 
 */
function mapReply(reply_type, reply, session) {
  const mapRegistration = () => {
    session.challenge = generateChallenge();
    
    reply.header('Secure-Session-Registration', 
      [
        '(ES256 RS256)',
        'path="/StartSession"',
        `origin="https://${reply.request.headers.host}"`,
        `challenge="${session.challenge}"`
      ].join('; ')
    );

    reply.setCookie(cookie.name, session.sessionId, 
      {
        maxAge: cookie.duration.perm,
        secure: true,
        sameSite: 'lax',
        path: '/'
      }
    );

    reply.send({ message: 'Logged in', sessionId: session.sessionId });
    //reply.send();
  };

  const mapConfig = () => {
    reply.setCookie(cookie.name, session.sessionId, 
      {
        maxAge: cookie.duration.temp,
        secure: true,
        sameSite: 'lax',
        path: '/'
      }
    );

    reply.send(
      {
        session_identifier: session.sessionId,
        refresh_url: endpoints.refresh,
        scope: {
          origin: `https://${reply.request.headers.host}`,
          include_site: false,
          scope_specification: []
        },
        credentials: [
          {
            type: 'cookie',
            name: cookie.name,
            attributes: 'Secure; SameSite=Lax'
          }
        ]
      }
    );
  }

  const mapChallenge = () => {
    session.challenge = generateChallenge();

    reply.header('Secure-Session-Challenge', 
      [
        `"${session.challenge}"`,
        `id="${session.sessionId}"`,
      ].join('; ')
    );

    reply.code(403).send();
  }

  switch (reply_type) {
    case 'send-registration-info':
      return mapRegistration();
    case 'send-config':
      return mapConfig();
    case 'send-challenge':
      return mapChallenge();
    default:
      console.error(`Invalid reply type: ${reply_type}`);
  }
}

export { mapRequest, mapReply };
