import fastify from 'fastify';
import cookie from '@fastify/cookie';
import config from './config.json' with { type: 'json' };
import fs from 'fs';
import path from 'path';
import { dbsc } from './dbsc/fastify-plugin/index.js';

const app = fastify(
  { 
    https: {
      key: fs.readFileSync('localhost+2-key.pem'),
      cert: fs.readFileSync('localhost+2.pem')
    },
    logger: true 
  }
);

await app.register(cookie);

await app.register(dbsc, config);

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

app.post(config.endpoints.auth, (request, reply) => { 
  reply.send({ message: 'Logged in', sessionId: request.session.id });
});

app.post(config.endpoints.register, (request, reply) => { 
  reply.send();
});

app.post(config.endpoints.refresh, (request, reply) => { 
  reply.send();
});

app.get('/api/protected', async (request, reply) => {
  const sessionId = request.cookies.auth_cookie;
  // const session = await sessions.get(sessionId);
  // if (!sessionId || !session) {
  if (!sessionId) {
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
