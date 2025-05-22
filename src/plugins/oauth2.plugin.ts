import fastifyPlugin from 'fastify-plugin';
import fastifyOauth2 from '@fastify/oauth2';
import { Type } from '@sinclair/typebox';

const fastifyOauth2Plugin = fastifyPlugin(async app => {
	app.register(fastifyOauth2, {
		name: 'GoogleOAuth2',
		scope: ['profile', 'email'],
		credentials: {
			client: {
				id: process.env.API_OAUTH2_GOOGLE_CLIENT,
				secret: process.env.API_OAUTH2_GOOGLE_SECRET
			},
			auth: fastifyOauth2.GOOGLE_CONFIGURATION,
		},
		startRedirectPath: '/oauth2/google',
		callbackUri: `http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}${process.env.API_OAUTH2_GOOGLE_CALLBACK_URI}`
	});

	// Example of reading the access token.
	app.get('/', {
		schema: {
			querystring: Type.Object({
				access_token: Type.String()
			})
		}
	}, async (req, res) => {
		res.send(req.query);
	});

	// Endpoint to retrieve token on server-side on successful login.
	app.get(process.env.API_OAUTH2_GOOGLE_CALLBACK_URI, async (req, res) => {
		const { token } = await app.GoogleOAuth2.getAccessTokenFromAuthorizationCodeFlow(req);
		res.redirect(`http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/?access_token=${token.access_token}`);
	});
});

export default fastifyOauth2Plugin;