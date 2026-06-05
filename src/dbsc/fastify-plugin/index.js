import { DBSCService } from '../DBSCService.js';
import { adaptRequest } from './adaptRequest.js';
import { adaptReply } from './adaptReply.js';
import fastifyPlugin from 'fastify-plugin';

const dbsc = fastifyPlugin(
  (fastify, options) => {
    const service = new DBSCService(options);

    const isApplicable = (request) => {
      const applicable = [
        options.endpoints.auth,
        options.endpoints.register,
        options.endpoints.refresh
      ];
      return applicable.includes(request.routeOptions.url);;
    }

    const prehook = async (request) => {
      request.dbscInputs = adaptRequest(options, request);
      request.session = await service.resolveSession(inputs);
    }

    const posthook = async (request, reply) => {
      const outputs = await service.dispatchHandler(request.dbscInputs, request.session);
      return adaptReply(outputs, reply);
    }

    fastify.decorateRequest('dbscInputs', null);
    fastify.decorateRequest('session', null);
    
    fastify.addHook('preHandler', async (request, reply) => {
      if (isApplicable(request)) {
        try {
          await prehook(request, reply)
        } catch (e) {
          console.error('Error occured in preHandler: ', e);
        }
      }
    });

    fastify.addHook('onSend', async (request, reply) => {
      if (isApplicable(request)) {
        try {
          return await posthook(request, reply)
        } catch (e) {
          console.error('Error occured in onSend: ', e);
        }
      }
    });
  }, 
  { name: 'dbsc-plugin' }
)

export { dbsc };
