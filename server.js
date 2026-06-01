import fastify from 'fastify';
import cookie from '@fastify/cookie';
import fs from 'fs';
import path from 'path';
import { handleRequest } from './requestHandler.js';
import { DeviceBoundSessionCollection } from './DeviceBoundSessionCollection.js';
import { endpoints } from './config.js';
import { DbscStateMachine } from './DbscStateMachine.js';

const app = fastify(
  { 
    https: {
      key: fs.readFileSync('localhost+2-key.pem'),
      cert: fs.readFileSync('localhost+2.pem')
    },
    logger: true 
  }
);

const sessions = new DeviceBoundSessionCollection();

const stateMachine = new DbscStateMachine();

await app.register(cookie);

// Enable CORS for testing
app.addHook('onRequest', async (request, reply) => {
  reply.header('Access-Control-Allow-Origin', request.headers.origin || '*');
  reply.header('Access-Control-Allow-Credentials', 'true');
  reply.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type, Sec-Secure-Session-Id, Sec-Session-Response, Secure-Session-Response');
  if (request.method === 'OPTIONS') {
    reply.code(204).send();
  }
});

app.get('/', async (request, reply) => {
  reply.type('text/html').send(fs.readFileSync(path.join(import.meta.dirname, 'index.html')));
});

app.post(endpoints.auth, (req, rep) => handleRequest(req, rep, sessions, stateMachine));

app.post(endpoints.register, (req, rep) => handleRequest(req, rep, sessions, stateMachine));
 
app.post(endpoints.refresh, (req, rep) => handleRequest(req, rep, sessions, stateMachine));

app.get('/api/protected', async (request, reply) => {
  const sessionId = request.cookies.auth_cookie;
  const session = await sessions.get(sessionId);
  if (!sessionId || !session) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
  reply.send({ message: 'Access granted', sessionId });
});

const start = async () => {
  try {
    await app.listen({ port: 4430 });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
