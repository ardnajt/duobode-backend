import fastifyJwt from '@fastify/jwt';
import { FastifyReply, FastifyRequest } from 'fastify';
import fastifyPlugin from 'fastify-plugin';

const fastifyJwtPlugin = fastifyPlugin(async app => {
	app.register(fastifyJwt, { secret: process.env.SECRET_KEY });

	app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
		try {
			await request.jwtVerify();
		}
		catch (err) {
			reply.send(err);
		}
	});
});

export default fastifyJwtPlugin;