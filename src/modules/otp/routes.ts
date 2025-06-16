import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { initORM } from '@orm';
import { Type } from '@sinclair/typebox';
import { Otp } from './otp.entity';
import dayjs from 'dayjs';
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

		let otp: Otp | null;
		otp = await em.findOne(Otp, { email: req.body.email }, { orderBy: { createdAt: 'desc' } });
		// If there wasn't a previous OTP or that it has been more than a minute since the previous was created
		if (!otp || dayjs().diff(otp.createdAt) > 60_000) {
			if (otp) await em.removeAndFlush(otp);
			otp = new Otp(req.body.email);
			await em.persistAndFlush(otp);	
		}

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
			html: `
			<h2>Your Verification Code</h2>
			<p>Please enter the following to verify your email address: <span style="font-weight:bold;">${otp.code}</span></p>
			<p>This code will expire in 5 minutes. For security reasons, please do not reveal this code to anyone.</p>
			<p>Thanks,<br />Team Homerent</p>
			`
		}).catch(() => null);

		return !!result ? true : false;
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

		const otp = await em.findOne(Otp, { email: req.body.email }, { orderBy: { createdAt: 'DESC' } });
		if (!otp) return res.status(404).send({ message: 'Email not found.' });
		if (otp.code !== req.body.code) return res.status(401).send({ message: 'Invalid code.' });
		if (dayjs().isAfter(otp.expiredAt)) return res.status(401).send({ message: 'Code expired.' });

		await em.removeAndFlush(otp);
		// Temporarily creatres a JWT token which stores the email for registration.
		return app.jwt.sign({ otp: 'register', email: otp.email });
	});
}

export default route;