import fastifyPlugin from 'fastify-plugin';
import { DBSCService } from '../DBSCService.js';

const dbscPluginPre = async (options, service, request) => {
  const inputs = {
    route: request.routeOptions.url,
    sessionId: request.cookies[options.cookie.name],
    secureSessionResponse: request.headers['secure-session-response'],
    secureSessionId: request.headers['sec-secure-session-id'],
  };

  request.dbscInputs = inputs;

  request.session = await service.resolveSession(inputs);
}

const dbscPluginPost = async (options, service, request, reply) => {

  const outputs = await service.dispatchHandler(request.dbscInputs, request.session);

  if (outputs.secureSessionRegistration) {
    reply.header('Secure-Session-Registration', outputs.secureSessionRegistration);
  }

  if (outputs.secureSessionChallenge) {
    reply.header('Secure-Session-Challenge', outputs.secureSessionChallenge);
  }

  if (outputs.setCookie) {
    reply.header('Set-Cookie', outputs.setCookie);
  }

  if (outputs.status) {
    reply.code(outputs.status);
  }

  if (outputs.payload) {
    return JSON.stringify(outputs.payload);
  }
}

const dbscPlugin = fastifyPlugin(
  (fastify, options) => {
    const service = new DBSCService(options);

    fastify.decorateRequest('dbscInputs', null);

    fastify.decorateRequest('session', null);

    fastify.addHook('preHandler', async (request, reply) => {
      const applicable = [
        options.endpoints.auth,
        options.endpoints.register,
        options.endpoints.refresh
      ].includes(request.routeOptions.url);

      if (applicable) {
        try {
          await dbscPluginPre(options, service, request, reply)
        } catch (e) {
          console.error('Error occured in dbscPluginPre: ', e);
        }
      }
    });

    fastify.addHook('onSend', async (request, reply) => {
      const applicable = [
        options.endpoints.auth,
        options.endpoints.register,
        options.endpoints.refresh
      ].includes(request.routeOptions.url);

      if (applicable) {
        try {
          return await dbscPluginPost(options, service, request, reply)
        } catch (e) {
          console.error('Error occured in dbscPluginPost: ', e);
        }
      }
    });
  }, 
  { name: 'dbsc-plugin' }
)

export { dbscPlugin };
