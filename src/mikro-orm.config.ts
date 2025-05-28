import dotenv from 'dotenv';
dotenv.config();

import { Migrator } from '@mikro-orm/migrations';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { SeedManager } from '@mikro-orm/seeder';

import { MySqlDriver } from '@mikro-orm/mysql';
import { SqliteDriver } from '@mikro-orm/sqlite';

const config = {
	driver: process.env.DB_DRIVER == 'sqlite' ? SqliteDriver : MySqlDriver,
	extensions: [SeedManager, Migrator],
	metadataProvider: TsMorphMetadataProvider,
	debug: Boolean(process.env.DB_DEBUG),
	dbName: `${process.env.DB_DRIVER == 'sqlite' ? './database/' : ''}${process.env.DB_NAME}${process.env.DB_DRIVER == 'sqlite' ? '.sqlite' : ''}`,
	host: process.env.DB_HOST,
	port: Number(process.env.DB_PORT),
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	entities: ['dist/**/*.entity.js'],
	entitiesTs: ['src/**/*.entity.ts']
};

export default config;