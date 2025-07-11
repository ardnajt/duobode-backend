declare namespace NodeJS {
	interface ProcessEnv {
		PORT: string;
		SERVER_URL: string;
		WEBSITE_URL: string;

		CORS: string;
		DEBUG: string;
		SECRET_KEY: string;

		DB_DEBUG: string;
		DB_DRIVER: 'mysql' | 'sqlite';
		DB_NAME: string;
		DB_HOST: string;
		DB_PORT: string;
		DB_USER: string;
		DB_PASS: string;

		EMAIL_AUTH_USER: string;
		EMAIL_AUTH_PASS: string;

		RECAPTCHA_HOSTNAME: string;
		RECAPTCHA_SECRET_KEY: string;

		API_ONEMAP_ACCESS_KEY: string;

		API_OAUTH2_GOOGLE_CLIENT: string;
		API_OAUTH2_GOOGLE_SECRET: string;

		API_OAUTH2_FACEBOOK_CLIENT: string;
		API_OAUTH2_FACEBOOK_SECRET: string;
	}
}