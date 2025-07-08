import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { initORM } from '@orm';
import { Method, User } from './user.entity';

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

	app.get('/phonenumber/:id', {
		onRequest: [app.authenticate],
		schema: {
			tags: ['user'],
			description: "Attempt to fetch a user's phone number provided the logged in user is a subscribed member",
			security: [{ BearerAuth: [] }],
			params: Type.Object({ id: Type.Number() })
		}
	}, async (req, res) => {
		const em = db.em.fork();
		const self = await em.findOneOrFail(User, req.user.id);
		// TODO: Check if self is a subscribed member before attempting to get phone number
		if (!self) return res.status(403).send({ message: 'Not a subscribed member' });

		const user = await em.findOneOrFail(User, req.params.id);
		return user.phone;
	});

	app.put('', {
		onRequest: [app.authenticate],
		schema: {
			tags: ['user'],
			security: [{ BearerAuth: [] }],
			body: Type.Object({
				name: Type.Optional(Type.String()),
				phone: Type.Optional(Type.Object({
					number: Type.Optional(Type.String()),
					prefix: Type.Optional(Type.String())
				}))
			})
		}
	}, async (req, res) => {
		const em = db.em.fork();
		const user = await em.findOneOrFail(User, req.user.id);

		if (req.body.name != undefined) user.name = req.body.name;
		if (req.body.phone?.number != undefined && req.body.phone.prefix != undefined) {
			// Sets phone number to unverified if they changed it
			if (user.phone.number != req.body.phone.number) user.phone.verified = false;
			user.phone.number = req.body.phone.number;
			user.phone.prefix = req.body.phone.prefix;
		}

		await em.persistAndFlush(user);
		return user.generateToken(app);
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
	
	app.get('/available', {
		schema: {
			tags: ['user'],
			description: 'Returns the method of the user with the provided email if it exists.',
			querystring: Type.Object({ email: Type.String() })
		}
	}, async (req, res) => {
		const em = db.em.fork();
		const user = await em.findOne(User, { email: req.query.email });
		return !!user ? user.method : null;
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
		if (req.user.otp != 'register') return res.status(401).send({ message: 'Provided token does originate from an OTP verification.' });

		const user = new User(req.user.email, req.body.name, Method.EMAIL);
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

	app.post('/unlink-phone', {
		onRequest: [app.authenticate],
		schema: {
			tags: ['user'],
			security: [{ BearerAuth: [] }]
		}
	}, async (req, res) => {
		const em = db.em.fork();

		const user = await em.findOneOrFail(User, req.user.id);
		user.phone.prefix = 'SG';
		user.phone.number = undefined;
		user.phone.verified = false;
		await em.persistAndFlush(user);

		return true;
	});
}

export default route;