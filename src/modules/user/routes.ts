import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { initORM } from '@orm';
import { User } from './user.entity';

const route: FastifyPluginAsyncTypebox = async app => {
	const db = await initORM();

	app.post('/register', {
		schema: {
			tags: ['user'],
			body: Type.Object({
				name: Type.String(),
				email: Type.String(),
				password: Type.String(),
				phone: Type.String(),
				age: Type.Number()
			})
		}
	}, async (request, reply) => {
		const em = db.em.fork();

		const user = new User(request.body.name, request.body.email, request.body.password, request.body.phone, request.body.age);
		await em.persistAndFlush(user);

		const token = app.jwt.sign({ user });
		return token;
	});

	app.post('/login', {
		schema: {
			tags: ['user'],
			body: Type.Object({
				email: Type.String(),
				password: Type.String()
			})
		}
	}, async (request, reply) => {
		const em = db.em.fork();

		const user = await em.findOne(User, { email: request.body.email });
		if (!user) return reply.status(401).send({ message: 'Invalid credentials.' });

		const verified = await user.verifyPassword(request.body.password);
		if (verified) return app.jwt.sign({ user });
		else reply.status(401).send({ message: 'Invalid credentials.' });
	});
}

export default route;