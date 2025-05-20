import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { initORM } from '@orm';
import { Gender, User } from './user.entity';

const route: FastifyPluginAsyncTypebox = async app => {
	const db = await initORM();

	app.post('/register', {
		schema: {
			tags: ['user'],
			body: Type.Object({
				name: Type.String({ examples: ["John Doe"] }),
				email: Type.String({ examples: ["user@gmail.com"] }),
				password: Type.String({ examples: ["password"] }),
				phone: Type.String({ examples: ["81234567"] }),
				age: Type.Number({ examples: ["21"] }),
				gender: Type.Enum(Gender, { examples: [Gender.MALE] })
			})
		}
	}, async (req, res) => {
		const em = db.em.fork();

		const user = new User(req.body.name, req.body.email, req.body.password, req.body.phone, req.body.age, req.body.gender);
		await em.persistAndFlush(user);

		const token = user.generateToken(app);
		return token;
	});

	app.post('/login', {
		schema: {
			tags: ['user'],
			body: Type.Object({
				email: Type.String({ examples: ["user@gmail.com"] }),
				password: Type.String({ examples: ["password"] })
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