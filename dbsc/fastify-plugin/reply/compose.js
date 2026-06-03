import { Session } from '../../Session.js';
import { generateChallenge } from '../../util.js';

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

  reply.setCookie(config.cookie.name, session.id, 
    {
      maxAge: config.cookie.duration.long,
      secure: true,
      sameSite: 'lax',
      path: '/'
    }
  );

  reply.send({ message: 'Logged in', sessionId: session.id });
  //reply.send();
}

function replyWithConfig(reply, session, config) {
  reply.setCookie(config.cookie.name, session.id, 
    {
      maxAge: config.cookie.duration.short,
      secure: true,
      sameSite: 'lax',
      path: '/'
    }
  );

  reply.send(
    {
      session_identifier: session.id,
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
      `id="${session.id}"`,
    ].join('; ')
  );

  reply.code(403).send();
}

/**
 * @param {'send-registration-info' | 'send-config' | 'send-challenge'} replyType
 * @param {FastifyReply} reply 
 * @param {Session} session 
 */
function composeReply(replyType, reply, session, config) {
  switch (replyType) {
    case 'send-registration-info':
      return replyWithSetup(reply, session, config);
    case 'send-config':
      return replyWithConfig(reply, session, config);
    case 'send-challenge':
      return replyWithChallenge(reply, session);
    default:
      console.error(`config: `, JSON.stringify(config));
      console.error(`session: `, session);
      console.error(`Invalid reply type: ${replyType}`);
  }
}

export { composeReply };
