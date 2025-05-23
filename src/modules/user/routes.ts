import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { initORM } from '@orm';
import { User } from './user.entity';

const route: FastifyPluginAsyncTypebox = async app => {
	const db = await initORM();

	app.get('', {
		onRequest: [app.authenticate],
		schema: {
			tags: ['user'],
			security: [{ BearerAuth: [] }]
		}
	}, async (req, res) => {
		const em = db.em.fork();
		return await em.findOneOrFail(User, req.user.id);
	});

	app.get('/:id', {
		schema: {
			tags: ['user'],
			params: Type.Object({ id: Type.Number() })
		}
	}, async (req, res) => {
		const em = db.em.fork();
		return await em.findOne(User, req.params.id);
	});

	app.post('/register', {
		schema: {
			tags: ['user'],
			body: Type.Object({ 
				email: Type.String({ examples: ['johndoe@gmail.com'] }),
				password: Type.String({ examples: ['password'] }),
				name: Type.String({ examples: ['John Doe'] })
			})
		}
	}, async (req, res) => {
		const em = db.em.fork();

		const user = new User(req.body.email, req.body.name);
		user.password = req.body.password;
		await em.persistAndFlush(user);

		const token = user.generateToken(app);
		return token;
	});

	app.post('/login', {
		schema: {
			tags: ['user'],
			body: Type.Object({
				email: Type.String({ examples: ['johndoe@gmail.com'] }),
				password: Type.String({ examples: ['password'] })
			})
		}
	}, async (req, res) => {
		const em = db.em.fork();

		const user = await em.findOne(User, { email: req.body.email });
		if (!user) return res.status(401).send({ message: 'Invalid credentials.' });

		const isVerified = await user.verifyPassword(req.body.password);
		if (isVerified) {
			const token = user.generateToken(app);
			return token;
		}
		else res.status(401).send({ message: 'Invalid credentials.' });
	});
}

export default route;