import { DeviceBoundSession } from './DeviceBoundSession.js';
import { generateChallenge } from './helpers.js';

/** @typedef {import('fastify').FastifyReply} FastifyReply */

function replyWithSetup(reply, session, config) {
  session.challenge = generateChallenge();
  
  reply.header('Secure-Session-Registration', 
    [
      '(ES256 RS256)',
      'path="/StartSession"',
      `origin="https://${reply.request.headers.host}"`,
      `challenge="${session.challenge}"`
    ].join('; ')
  );

  reply.setCookie(config.cookie.name, session.sessionId, 
    {
      maxAge: config.cookie.duration.long,
      secure: true,
      sameSite: 'lax',
      path: '/'
    }
  );

  reply.send({ message: 'Logged in', sessionId: session.sessionId });
  //reply.send();
}

function replyWithConfig(reply, session, config) {
  reply.setCookie(config.cookie.name, session.sessionId, 
    {
      maxAge: config.cookie.duration.short,
      secure: true,
      sameSite: 'lax',
      path: '/'
    }
  );

  reply.send(
    {
      session_identifier: session.sessionId,
      refresh_url: config.endpoints.refresh,
      scope: {
        origin: `https://${reply.request.headers.host}`,
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
    }
  );
}

function replyWithChallenge(reply, session) {
  session.challenge = generateChallenge();

  reply.header('Secure-Session-Challenge', 
    [
      `"${session.challenge}"`,
      `id="${session.sessionId}"`,
    ].join('; ')
  );

  reply.code(403).send();
}

/**
 * @param {'send-registration-info' | 'send-config' | 'send-challenge'} replyType
 * @param {FastifyReply} reply 
 * @param {DeviceBoundSession} session 
 */
function composeReply(replyType, reply, session, config) {
  switch (replyType) {
    case 'send-registration-info':
      return replyWithSetup();
    case 'send-config':
      return replyWithConfig();
    case 'send-challenge':
      return replyWithChallenge();
    default:
      console.error(`Invalid reply type: ${replyType}`);
  }
}

export { composeReply };
