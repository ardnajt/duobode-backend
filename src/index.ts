import 'module-alias/register';
import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import chalk from 'chalk';

import fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import fastifyAutoload from '@fastify/autoload';

import fastifySwaggerPlugin from '@plugins/swagger.plugin';
import fastifyJwtPlugin from '@plugins/jwt.plugin';
import fastifyOauth2Plugin from '@plugins/oauth2.plugin';

import { FastifyJwtNamespace } from '@fastify/jwt';
import { OAuth2Namespace } from '@fastify/oauth2';

const app = fastify({ 
	logger: Boolean(process.env.SERVER_DEBUG),
	pluginTimeout: 0
});

declare module '@fastify/jwt' {
	interface FastifyJWT {
		user: { id: number, email: string };
	}
}
declare module 'fastify' {
  interface FastifyInstance extends FastifyJwtNamespace<{ namespace: 'security' }> {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
		GoogleOAuth2: OAuth2Namespace;
		FacebookOAuth2: OAuth2Namespace;
  }
}


async function bootstrap() {
	app.register(fastifyCors, { origin: process.env.CORS_ORIGIN });
	app.register(fastifySwaggerPlugin);
	app.register(fastifyJwtPlugin);
	app.register(fastifyOauth2Plugin);
	app.register(fastifyMultipart);
	app.register(fastifyAutoload, {
		dir: path.join(__dirname, 'modules'),
		matchFilter: file => file.includes('routes.')
	});

	await app.ready();
	app.swagger();

	app.listen({ port: Number(process.env.SERVER_PORT) ?? 3000 }, (err, address) => {
		if (err) {
			app.log.error(err);
			process.exit(1);
		}
		else console.log(`Visit ${chalk.green(`${address}/docs`)} for API documentation.`);
	});
}

bootstrap();