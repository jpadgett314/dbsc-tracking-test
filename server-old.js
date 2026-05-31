import fastify from 'fastify';
import cookie from '@fastify/cookie';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { decodeProtectedHeader, importJWK, jwtVerify } from 'jose';

const app = fastify(
  { 
    https: {
      key: fs.readFileSync('localhost+2-key.pem'),
      cert: fs.readFileSync('localhost+2.pem')
    },
    logger: true 
  }
);

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

// In-memory session storage (for POC)
const sessions = new Map();

// Generate a random session ID
function generateSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

// Generate a challenge value
function generateChallenge() {
  return crypto.randomBytes(32).toString('base64url');
}

// Verify challenge using stored public key
async function verifyChallenge(sessionId, jwt) {
  const session = sessions.get(sessionId);
  if (!session) {
    console.error('Invalid session ID');
    return false;
  } else {
    if (!session.publicKey) {
      console.error('Session lacks publicKey');
      return false;
    } else {
      const transformed = await jwtVerify(jwt, session.publicKey);
      const jti = transformed?.payload?.jti;
      if (!jti) {
        console.error('Failed to extract JTI');
        return false;
      } else {
        if (!session.challenge) {
          console.error('Session lacks challenge');
          return false;
        } else {
          return session.challenge == jti;
        }
      }
    }
  }
}

// Serve the HTML frontend
app.get('/', async (request, reply) => {
  reply.type('text/html').send(fs.readFileSync(path.join(import.meta.dirname, 'index.html')));
});

// Login endpoint - returns long-lived cookie and registration header
app.post('/login', async (request, reply) => {
  const sessionId = generateSessionId();

  // Set long-lived cookie
  reply.setCookie('auth_cookie', sessionId, {
    maxAge: 2592000, // 30 days
    secure: true,
    sameSite: 'lax',
    path: '/'
  });

  const challenge = generateChallenge();
  sessions.set(sessionId, {
    challenge,
    createdAt: Date.now(),
    publicKey: null,
  });

  // Set DBSC registration header
  const protocol = request.protocol || (request.connection && request.connection.encrypted ? 'https' : 'http');
  const origin = `${protocol}://${request.headers.host}`;
  reply.header('Secure-Session-Registration', `(ES256 RS256); path="/StartSession"; origin="${origin}"; challenge="${challenge}"`);

  reply.send({ message: 'Logged in', sessionId });
});

// Session registration endpoint
app.post('/StartSession', async (request, reply) => {
  // Extract session ID from cookie
  const sessionId = request.cookies.auth_cookie;
  if (!sessionId) {
    return reply.code(401).send({ error: 'No session cookie' });
  }

  // Initial JWT
  const jwt = request.headers['secure-session-response'];
  if (!jwt) {
    return reply.code(400).send({ error: 'No challenge pending' });
  }

  const { alg, jwk } = decodeProtectedHeader(jwt);
  const publicKey = await importJWK(jwk, alg);

  // Store the public key
  const session = sessions.get(sessionId) ?? {};
  session.publicKey = publicKey;

  if (session.challenge) {
    const isValid = await verifyChallenge(sessionId, jwt);
    if (!isValid) {
      console.log("CHALLENGE FAILED [STARTSESSION]");
      return reply.code(403).send({ error: 'Invalid signature' });
    }
  }

  delete session.challenge;

  // Replace with short-lived cookie
  reply.setCookie('auth_cookie', sessionId, {
    maxAge: 60,
    secure: true,
    sameSite: 'lax',
    path: '/'
  });

  // Session configuration
  const protocol = request.protocol || (request.connection && request.connection.encrypted ? 'https' : 'http');
  const origin = `${protocol}://${request.headers.host}`;
  
  const config = {
    session_identifier: sessionId,
    refresh_url: '/RefreshEndpoint',
    scope: {
      origin: origin,
      include_site: false,
      scope_specification: []
    },
    credentials: [{
      type: 'cookie',
      name: 'auth_cookie',
      attributes: 'Secure; SameSite=Lax'
    }]
  };

   reply.send(config);
});
 
// Refresh endpoint - handles cookie refresh
app.post('/RefreshEndpoint', async (request, reply) => {
  const sessionId = request.headers['sec-secure-session-id'];
  if (!sessionId) {
    return reply.code(400).send({ error: 'Missing Sec-Secure-Session-Id header' });
  }

  // Check if this is a response to a challenge
  const jwt = request.headers['secure-session-response'];

  if (!jwt) {
    // Step 1: Issue a challenge
    const challenge = generateChallenge();
    const session = sessions.get(sessionId);
    if (session) {
      session.challenge = challenge;
    }

    console.log("CHALLENGE:", `"${challenge}"; id="${sessionId}"`);
    reply.code(403)
      .header('Secure-Session-Challenge', `"${challenge}"; id="${sessionId}"`)
      .send();
    return;
  }

  // Step 2: Verify the signed challenge
  const session = sessions.get(sessionId);
  if (!session || !session.challenge) {
    return reply.code(400).send({ error: 'No challenge pending' });
  }

  const isValid = await verifyChallenge(sessionId, jwt);

  if (!isValid) {
    console.log("CHALLENGE FAILED.");
    return reply.code(403).send({ error: 'Invalid signature' });
  }

  // Clear the challenge
  delete session.challenge;

  // Issue refreshed short-lived cookie
  reply.setCookie('auth_cookie', sessionId, {
    maxAge: 600, // 10 minutes
    secure: true,
    sameSite: 'lax',
    path: '/'
  });

  // Session configuration
  const protocol = request.protocol || (request.connection && request.connection.encrypted ? 'https' : 'http');
  const origin = `${protocol}://${request.headers.host}`;
  
  const config = {
    session_identifier: sessionId,
    refresh_url: '/RefreshEndpoint',
    scope: {
      origin: origin,
      include_site: false,
      scope_specification: []
    },
    credentials: [{
      type: 'cookie',
      name: 'auth_cookie',
      attributes: 'Secure; SameSite=Lax'
    }]
  };

   reply.send(config);
});

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
    // await app.listen({ port: 3000, host: '0.0.0.0' });
    // console.log('Server listening on http://localhost:3000');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
