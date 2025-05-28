declare namespace NodeJS {
	interface ProcessEnv {
		HOST: string;
		PORT: string;
		CORS_ORIGIN: string;

		DEBUG: string;
		SECRET_KEY: string;
		CLIENT_URL: string;

		DB_DEBUG: string;
		DB_DRIVER: 'mysql' | 'mariadb' | 'sqlite';
		DB_NAME: string;
		DB_HOST: string;
		DB_PORT: string;
		DB_USER: string;
		DB_PASS: string;

		EMAIL_AUTH_USER: string;
		EMAIL_AUTH_PASS: string;

		API_ONEMAP_ACCESS_KEY: string;

		API_OAUTH2_GOOGLE_CLIENT: string;
		API_OAUTH2_GOOGLE_SECRET: string;

		API_OAUTH2_FACEBOOK_CLIENT: string;
		API_OAUTH2_FACEBOOK_SECRET: string;
	}
}