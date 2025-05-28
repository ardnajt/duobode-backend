import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastifyPlugin from 'fastify-plugin';

const fastifySwaggerPlugin = fastifyPlugin(async app => {
	app.register(fastifySwagger, {
		openapi: {
			components: {
				securitySchemes: {
					BearerAuth: {
						type: 'http',
						scheme: 'bearer',
						bearerFormat: 'JWT'
					}
				}
			}
		}
	});
	app.register(fastifySwaggerUi, { routePrefix: '/' });
});

export default fastifySwaggerPlugin;