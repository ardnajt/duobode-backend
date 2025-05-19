import dotenv from 'dotenv';
dotenv.config();

import { Migrator } from '@mikro-orm/migrations';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { SeedManager } from '@mikro-orm/seeder';

import { SqliteDriver, Options } from '@mikro-orm/sqlite';

const config: Options = {
	driver: SqliteDriver,
	extensions: [SeedManager, Migrator],
	metadataProvider: TsMorphMetadataProvider,
	debug: Boolean(process.env.DB_DEBUG),
	dbName: `./database/${process.env.DB_NAME}`,
	entities: ['dist/**/*.entity.js'],
	entitiesTs: ['src/**/*.entity.ts']
};

export default config;