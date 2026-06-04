import fastifyPlugin from 'fastify-plugin';
import { DbscService } from './DbscService.js';

const dbscPlugin = fastifyPlugin(
  (fastify, options) => {
    const service = new DbscService(options);
    // fastify.post(options.endpoints.auth, (req, rep) => service.handle(req, rep));
    // fastify.post(options.endpoints.register, (req, rep) => service.handle(req, rep));
    // fastify.post(options.endpoints.refresh, (req, rep) => service.handle(req, rep));

    fastify.addHook('onSend', async (request, reply, payload) => {
      const applicable = [
        options.endpoints.auth,
        options.endpoints.register,
        options.endpoints.refresh
      ].includes(request.routeOptions.url);

      console.log(request.routeOptions.url);
      if (applicable) {
        console.log('applicable');
        // return service.handle(request, reply);
      }
    });
  }, 
  { name: 'dbsc-plugin' }
)

export { dbscPlugin };
