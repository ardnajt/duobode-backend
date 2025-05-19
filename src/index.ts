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
import { FastifyJwtNamespace } from '@fastify/jwt';

const app = fastify({ logger: Boolean(process.env.SERVER_DEBUG) });

declare module 'fastify' {
  interface FastifyInstance extends FastifyJwtNamespace<{ namespace: 'security' }> {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

async function bootstrap() {
	app.register(fastifyCors, { origin: process.env.CORS_ORIGIN });
	app.register(fastifySwaggerPlugin);
	app.register(fastifyJwtPlugin);
	app.register(fastifyMultipart);
	app.register(fastifyAutoload, {
		dir: path.join(__dirname, 'modules'),
		matchFilter: file => file.endsWith('routes.ts')
	});

	await app.ready();
	app.swagger();

	app.listen({ host: process.env.SERVER_HOST, port: Number(process.env.SERVER_PORT) }, (err, address) => {
		if (err) {
			app.log.error(err);
			process.exit(1);
		}
		else console.log(`Visit ${chalk.green(`${address}/docs`)} for API documentation.`);
	});
}

bootstrap();