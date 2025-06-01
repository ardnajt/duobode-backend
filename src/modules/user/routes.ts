import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { initORM } from '@orm';
import { User } from './user.entity';

const route: FastifyPluginAsyncTypebox = async app => {
	const db = await initORM();
	const exclude = ['password'] as const;

	app.get('', {
		onRequest: [app.authenticate],
		schema: {
			tags: ['user'],
			security: [{ BearerAuth: [] }]
		}
	}, async (req, res) => {
		const em = db.em.fork();
		return await em.findOneOrFail(User, req.user.id, { exclude });
	});

	app.get('/:id', {
		schema: {
			tags: ['user'],
			params: Type.Object({ id: Type.Number() })
		}
	}, async (req, res) => {
		const em = db.em.fork();
		return await em.findOne(User, req.params.id, { exclude });
	});
	
	app.get('/email-available', {
		schema: {
			tags: ['user'],
			querystring: Type.Object({ email: Type.String() })
		}
	}, async (req, res) => {
		const em = db.em.fork();
		const user = await em.findOne(User, { email: req.query.email });
		return !!user ? true : false;
	});

	app.post('/register', {
		onRequest: [app.authenticate],
		schema: {
			tags: ['user'],
			security: [{ BearerAuth: [] }],
			body: Type.Object({
				name: Type.String({ examples: ['John Doe'] }),
				password: Type.String({ examples: ['password'] }),
			})
		}
	}, async (req, res) => {
		const em = db.em.fork();
		if (!req.user.otp) return res.status(401).send({ message: 'Provided token does originate from an OTP verification.' });

		const user = new User(req.user.email, req.body.name);
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