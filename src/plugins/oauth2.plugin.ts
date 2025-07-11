import fastifyPlugin from 'fastify-plugin';
import fastifyOauth2 from '@fastify/oauth2';
import { initORM } from '@orm';
import { Method, User } from '@modules/user/user.entity';
import axios from 'axios';
import { FastifyReply } from 'fastify';
import crypto from 'crypto';

const fastifyOauth2Plugin = fastifyPlugin(async app => {
	const db = await initORM();

	/** Generates a completely random 16-long alphanumeric password. */
	function generatePassword() {
		let result = '';
		const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		const charsetLen = charset.length;

		while (result.length < 16) {
			const byte = crypto.randomBytes(1)[0];
			if (byte < charsetLen * 4) result += charset[byte % charsetLen];
		}

		return result;
	}
	
	/**
	 * Retrieves or creates a user based on a social login (e.g., Google, Facebook),
	 * and returns a login token.
	 *
	 * Logic:
	 * - If a user exists with the same email but a different linked social ID, it returns an account conflict error.
	 * - If no user exists with the email, it attempts to find or create a user using the provided social ID.
	 * - If found or created successfully, a token is generated and returned.
	 * - Redirects back to a provided route with the token automatically set as its cookie.
	 *
	 * @param reply - Fastify reply object used for sending error responses.
	 * @param provider - The social provider key (e.g., 'googleId', 'facebookId').
	 * @param idx - The unique ID from the social provider.
	 * @param email - The email address provided by the social provider.
	 * @param name - The display name of the user from the social provider.
	 * @returns A signed token for the authenticated user, or an error response.
	 */
	async function handleUserLogin(reply: FastifyReply, email: string, name: string) {
		const em = db.em.fork();

		let token: string;

		const user = await em.findOne(User, { email });
		if (user) token = user.generateToken(app);
		else {
			const user = new User(email, name, Method.SOCIAL);
			user.password = generatePassword();
			await em.persistAndFlush(user);
			token = user.generateToken(app);
		}

		reply.setCookie('token', token, {
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			path: '/'
		}).redirect(`${process.env.WEBSITE_URL}?sync=1`);
	}

	// #region Google
	app.register(fastifyOauth2, {
		name: 'GoogleOAuth2',
		scope: ['profile', 'email'],
		credentials: {
			client: {
				id: process.env.API_OAUTH2_GOOGLE_CLIENT,
				secret: process.env.API_OAUTH2_GOOGLE_SECRET
			},
		},
		discovery: {
			issuer: 'https://accounts.google.com'
		},
		startRedirectPath: '/oauth2/google',
		callbackUri: `${process.env.SERVER_URL}/oauth2/google/callback`
	});

	app.get(`/oauth2/google/callback`, { schema: { hide: true } }, async (req, res) => {
		const { token: authorisation } = await app.GoogleOAuth2.getAccessTokenFromAuthorizationCodeFlow(req);
		const info = await app.GoogleOAuth2.userinfo(authorisation.access_token) as { email: string, name: string, picture: string };

		await handleUserLogin(res, info.email, info.name);
	});
	// #endregion

	// #region Facebook
	app.register(fastifyOauth2, {
		name: 'FacebookOAuth2',
		scope: ['public_profile', 'email'],
		credentials: {
			client: {
				id: process.env.API_OAUTH2_FACEBOOK_CLIENT,
				secret: process.env.API_OAUTH2_FACEBOOK_SECRET
			},
			auth: fastifyOauth2.FACEBOOK_CONFIGURATION
		},
		startRedirectPath: '/oauth2/facebook',
		callbackUri: `${process.env.SERVER_URL}/oauth2/facebook/callback`
	});

	app.get(`/oauth2/facebook/callback`, { schema: { hide: true } }, async (req, res) => {
		const { token: authorisation } = await app.FacebookOAuth2.getAccessTokenFromAuthorizationCodeFlow(req);
		const response = await axios.get<{ name: string, email: string, id: string }>('https://graph.facebook.com/me', { params: { access_token: authorisation.access_token, fields: 'name,email' } });
		await handleUserLogin(res, response.data.email, response.data.name);
	});
	// #endregion
});

export default fastifyOauth2Plugin;