import fastifyPlugin from 'fastify-plugin';
import fastifyOauth2 from '@fastify/oauth2';
import axios from 'axios';
import { initORM } from '@orm';
import { User } from '@modules/user/user.entity';

const fastifyOauth2Plugin = fastifyPlugin(async app => {
	const db = await initORM();

	app.register(fastifyOauth2, {
		name: 'GoogleOAuth2',
		scope: ['profile', 'email'],
		credentials: {
			client: {
				id: process.env.API_OAUTH2_GOOGLE_CLIENT,
				secret: process.env.API_OAUTH2_GOOGLE_SECRET
			},
			// auth: fastifyOauth2.GOOGLE_CONFIGURATION,
		},
		discovery: {
			issuer: 'https://accounts.google.com'
		},
		startRedirectPath: '/oauth2/google',
		callbackUri: `http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}${process.env.API_OAUTH2_GOOGLE_CALLBACK_URI}`
	});

	// Endpoint to retrieve token on server-side on successful login.
	app.get(process.env.API_OAUTH2_GOOGLE_CALLBACK_URI, async (req, res) => {
		const em = db.em.fork();

		const { token: accessToken } = await app.GoogleOAuth2.getAccessTokenFromAuthorizationCodeFlow(req);
		const info = await app.GoogleOAuth2.userinfo(accessToken.access_token) as { sub: string, email: string, picture: string, name: string };

		let created = false;
		let user = await em.findOne(User, { social: { googleId: info.sub }});
		if (!user) {
			created = true;
			user = new User(info.name, info.email);
			user.social = { googleId: info.sub };
			await em.persistAndFlush(user);
		}

		const token = user.generateToken(app);
		return created ? `You have created a new account with ${token}.` : `You have logged in with ${token}.`;
	});
});

export default fastifyOauth2Plugin;