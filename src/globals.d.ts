declare namespace NodeJS {
  interface ProcessEnv {
    CORS_ORIGIN: string;

		SECRET_KEY: string;
		SERVER_DEBUG: string;
		SERVER_HOST: string;
		SERVER_PORT: string;

		DB_DEBUG: string;
		DB_NAME: string;
		DB_HOST: string;
  }
}