import fastify from 'fastify';
import cookie from '@fastify/cookie';
import fs from 'fs';
import path from 'path';
import { handleRequest } from './requestHandler';
import { DeviceBoundSessionCollection } from './DeviceBoundSessionCollection';
import { endpoints } from './config';

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

// Register cookie plugin
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

// Serve the HTML frontend
app.get('/', async (request, reply) => {
  reply.type('text/html').send(fs.readFileSync(path.join(import.meta.dirname, 'index.html')));
});

app.post(endpoints.auth, (req, rep) => handleRequest(req, rep, sessions));

app.post(endpoints.register, (req, rep) => handleRequest(req, rep, sessions));
 
app.post(endpoints.refresh, (req, rep) => handleRequest(req, rep, sessions));

// Protected endpoint to test authentication
app.get('/api/protected', async (request, reply) => {
  const sessionId = request.cookies.auth_cookie;
  if (!sessionId || !sessions.has(sessionId)) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
  reply.send({ message: 'Access granted', sessionId });
});

// Start server
const start = async () => {
  try {
    await app.listen({ port: 4430 });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
