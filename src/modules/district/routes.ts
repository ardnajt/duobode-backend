import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { initORM } from '@orm';
import District from './district.entity';
import { Type } from '@sinclair/typebox';
import { FilterQuery } from '@mikro-orm/sqlite';

const route: FastifyPluginAsyncTypebox = async (app) => {
	const db = await initORM();

	app.get('', {
		schema: {
			tags: ['district'],
			querystring: Type.Object({ region: Type.Optional(Type.Number()) })
		}
	}, async (req, res) => {
		const em = db.em.fork();
		
		const where: FilterQuery<District> = {};
		if (req.query.region) where.region = req.query.region;

		return await em.find(District, where);
	});
}

export default route;