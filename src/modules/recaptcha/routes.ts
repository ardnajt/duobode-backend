import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import axios from 'axios';

interface RecaptchaResult {
	action: string;
	challenge_ts: string;
	hostname: string;
	score: number;
	success: boolean;
}

const route: FastifyPluginAsyncTypebox = async function(app) {
	app.post('/verify', {
		schema: {
			tags: ['recaptcha'],
			body: Type.Object({ token: Type.String() })
		}
	}, async (req) => {
		const params = new URLSearchParams();
		params.append('secret', process.env.RECAPTCHA_SECRET_KEY);
		params.append('response', req.body.token);

		try {
			const response = await axios.post<RecaptchaResult>('https://www.google.com/recaptcha/api/siteverify', params.toString());
			const { data: result } = response;

			// If it's not successful, or the hostname doesn't match the environment variable
			if (!result.success || result.hostname != process.env.RECAPTCHA_HOSTNAME) return false;
			else {
				if (result.score >= 0.7 && result.action == 'verify') return true;
				else return false;
			}
		}
		catch {
			return false;
		}
	});
}

export default route;