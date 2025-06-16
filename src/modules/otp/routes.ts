import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { initORM } from '@orm';
import { Type } from '@sinclair/typebox';
import { EmailOtp } from './emailOtp.entity';
import dayjs from 'dayjs';
import nodemailer from 'nodemailer';
import { User } from '@modules/user/user.entity';
import { PhoneOtp } from './phoneOtp.entity';

const route: FastifyPluginAsyncTypebox = async app => {
	const db = await initORM();

	app.post('/send-email', {
		schema: {
			tags: ['otp'],
			body: Type.Object({
				email: Type.String({ examples: ['johndoe@gmail.com'] })
			})
		}
	}, async (req, res) => {
		const em = db.em.fork();

		let otp: EmailOtp | null;
		otp = await em.findOne(EmailOtp, { email: req.body.email }, { orderBy: { createdAt: 'desc' } });
		// If there wasn't a previous OTP or that has expired
		if (!otp || dayjs().isAfter(otp.expiredAt)) {
			if (otp) em.remove(otp);
			otp = new EmailOtp(req.body.email);
			em.persist(otp);
			await em.flush();
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

	app.post('/verify-email', {
		schema: {
			tags: ['otp'],
			body: Type.Object({
				email: Type.String({ examples: ['johndoe@gmail.com'] }),
				code: Type.String({ examples: ['123456'] })
			})
		}
	}, async (req, res) => {
		const em = db.em.fork();

		const otp = await em.findOne(EmailOtp, { email: req.body.email }, { orderBy: { createdAt: 'DESC' } });
		if (!otp) return res.status(404).send({ message: 'Email not found.' });
		if (otp.code !== req.body.code) return res.status(401).send({ message: 'Invalid code.' });
		if (dayjs().isAfter(otp.expiredAt)) return res.status(401).send({ message: 'Code expired.' });

		await em.removeAndFlush(otp);
		// Temporarily creatres a JWT token which stores the email for registration.
		return app.jwt.sign({ otp: 'register', email: otp.email });
	});

	app.post('/send-sms', {
		onRequest: [app.authenticate],
		schema: {
			tags: ['otp'],
			security: [{ BearerAuth: [] }],
			body: Type.Object({
				prefix: Type.String(),
				number: Type.String()
			})
		}
	}, async (req, res) => {
		const em = db.em.fork();

		const user = await em.findOneOrFail(User, req.user.id);

		// Check if this phone is already in use by another user
		const isPhoneVerified = await em.count(User, { 
			$and: [
				{ id: { $ne: user.id } },
				{ phone: { ...req.body, verified: true }}
			]
		});
		if (isPhoneVerified) return res.status(409).send({ message: 'Phone number is already in use by another account.' }); 

		user.phone.prefix = req.body.prefix;
		user.phone.number = req.body.number;
		user.phone.verified = false;
		em.persist(user);

		let otp: PhoneOtp | null;
		otp = await em.findOne(PhoneOtp, { user: req.user.id });
		
		// If no OTP can be found, or the otp has expired
		if (!otp || dayjs().isAfter(otp.expiredAt)) {
			if (otp) em.remove(otp);
			otp = new PhoneOtp(user, req.body);
			em.persist(otp);
			await em.flush();
		}
		// Else if the OTP hasn't expired yet
		else if (otp.phone.number != req.body.number || otp.phone.prefix != req.body.prefix) {
			em.remove(otp);
			otp = new PhoneOtp(user, req.body);
			em.persist(otp);
			await em.flush();
		}

		// TODO: SMS sending method here

		return true;
	})

	app.post('/verify-phone', {
		onRequest: [app.authenticate],
		schema: {
			tags: ['otp'],
			security: [{ BearerAuth: [] }],
			body: Type.Object({
				code: Type.String({ examples: ['123456'] })
			})
		}
	}, async (req, res) => {
		const em = db.em.fork();

		const user = await em.findOneOrFail(User, req.user.id);
		if (user.phone.verified) return res.status(500).send({ message: 'Phone number already verified.' });

		// Check if this phone is already in use by another user and verified
		const isPhoneVerified = await em.count(User, { 
			$and: [
				{ id: { $ne: req.user.id } },
				{ phone: { number: user.phone.number, prefix: user.phone.prefix, verified: true }}
			]
		});
		
		if (isPhoneVerified) {
			user.phone.prefix = 'SG';
			user.phone.number = undefined;

			await em.persistAndFlush(user);
			return res.status(409).send({ message: 'Phone number already in use by another account.' });
		}
		else {
			const otp = await em.findOne(PhoneOtp, { user: req.user.id }, { orderBy: { createdAt: 'DESC' } });
			if (!otp) return res.status(404).send({ message: 'No OTP was recently sent to this phone number.' });
			if (otp.code !== req.body.code) return res.status(401).send({ message: 'Invalid code.' });
			if (dayjs().isAfter(otp.expiredAt)) return res.status(401).send({ message: 'Code expired.' });

			user.phone.prefix = otp.phone.prefix;
			user.phone.number = otp.phone.number;
			user.phone.verified = true;

			em.remove(otp);
			em.persist(user);
			await em.flush();

			return true;
		}
	});
}

export default route;