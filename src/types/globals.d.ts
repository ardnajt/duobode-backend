declare namespace NodeJS {
	interface ProcessEnv {
		CORS_ORIGIN: string;
		CLIENT_URL: string;

		SECRET_KEY: string;
		SERVER_DEBUG: string;
		SERVER_HOST: string;
		SERVER_PORT: string;

		DB_DEBUG: string;
		DB_NAME: string;
		DB_HOST: string;

		EMAIL_AUTH_USER: string;
		EMAIL_AUTH_PASS: string;

		API_ONEMAP_ACCESS_KEY: string;

		API_OAUTH2_GOOGLE_CLIENT: string;
		API_OAUTH2_GOOGLE_SECRET: string;

		API_OAUTH2_FACEBOOK_CLIENT: string;
		API_OAUTH2_FACEBOOK_SECRET: string;
	}
}