import { FastifyReply, FastifyRequest } from 'fastify'
import { cookie, endpoints } from './config'
import { DeviceBoundSessionCollection } from './DeviceBoundSessionCollection.js';
import { DeviceBoundSession } from './DeviceBoundSession.js';
import { generateSessionId } from './helpers.js';
import { mapReply, mapRequest } from './DbscHttp.js';
import { DbscStateMachine } from './DbscStateMachine.js';

// /** @typedef {import(fastify).FastifyRequest} FastifyRequest */
// /** @typedef {import(fastify).FastifyReply} FastifyReply */

/**
 * @param {FastifyRequest} request 
 * @param {FastifyReply} reply 
 * @param {DeviceBoundSessionCollection} sessions
 * @param {DbscStateMachine} stateMachine
 */
async function handleRequest(request, reply, sessions, stateMachine) {
  const cookieId = request.cookies[cookie.name];
  const headerId = request.headers['sec-secure-session-id'];

  let id = cookieId || headerId;
  let session = sessions.get(id);

  if (!session) {
    id = generateSessionId(); 
    session = new DeviceBoundSession(id, null, null)
    sessions.set(id, session);
  }

  const input = await mapRequest(request, session);

  const replyType = stateMachine.transition(input);

  mapReply(replyType, reply, session);
}

export { handleRequest };
