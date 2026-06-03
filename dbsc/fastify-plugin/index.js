import fastifyPlugin from "fastify-plugin";
import { DbscService } from "./DbscService";

const dbscPlugin = fastifyPlugin(
  (fastify, options) => {
    const service = new DbscService(options);
    fastify.post(options.endpoints.auth, (req, rep) => service.handle(req, rep));
    fastify.post(options.endpoints.register, (req, rep) => service.handle(req, rep));
    fastify.post(options.endpoints.refresh, (req, rep) => service.handle(req, rep));
  }, 
  { name: 'dbsc-plugin' }
)

export { dbscPlugin };
