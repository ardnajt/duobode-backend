import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { initORM } from '@orm';
import { Type } from '@sinclair/typebox';
import { Otp } from './otp.entity';
import nodemailer from 'nodemailer';

const route: FastifyPluginAsyncTypebox = async app => {
	const db = await initORM();

	app.post('/send', {
		schema: {
			tags: ['otp'],
			body: Type.Object({
				email: Type.String({ examples: ['johndoe@gmail.com'] })
			})
		}
	}, async (req, res) => {
		const em = db.em.fork();
		const otp = new Otp(req.body.email);
		await em.persistAndFlush(otp);

		const transporter = nodemailer.createTransport({
			service: 'gmail',
			host: 'smtp.gmail.com',
			port: 465,
			secure: true,
			auth: {
				user: process.env.EMAIL_AUTH_USER,
				pass: process.env.EMAIL_AUTH_PASS
			}
		});

		const result = await transporter.sendMail({
			from: `"Homerent" <${process.env.EMAIL_AUTH_USER}>`,
			to: req.body.email,
			subject: `${otp.code} Verification Code from Homerent`,
			text: `
			Please enter the following code to verify your email address: **${otp.code}**.
			This code will expire in 5 minutes. For security reasons, please do not reveal this code to anyone.

			Thanks,
			Team Homerent
			`
		});

		return result;
	});

	app.post('/verify', {
		schema: {
			tags: ['otp'],
			body: Type.Object({
				email: Type.String({ examples: ['johndoe@gmail.com'] }),
				code: Type.String({ examples: ['123456'] })
			})
		}
	}, async (req, res) => {
		const em = db.em.fork();

		const otp = await em.findOne(Otp, { email: req.body.email }, { orderBy: { createdTimestamp: 'DESC' } });
		if (!otp) return res.status(404).send({ message: 'Email not found.' });
		if (otp.code !== req.body.code) return res.status(401).send({ message: 'Invalid code.' });
		if (otp.expirationTimestamp < Date.now()) return res.status(401).send({ message: 'Code expired.' });

		await em.removeAndFlush(otp);
		// Temporarily creatres a JWT token which stores the email for registration.
		return app.jwt.sign({ email: otp.email });
	});
}

export default route;