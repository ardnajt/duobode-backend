import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { initORM } from '@orm';
import District from './district.entity';
import { Type } from '@sinclair/typebox';

const route: FastifyPluginAsyncTypebox = async (app) => {
	const db = await initORM();

	app.get('', {
		schema: {
			tags: ['district'],
			querystring: Type.Object({ region: Type.Optional(Type.Number()) })
		}
	}, async (req, res) => {
		const em = db.em.fork();
		return await em.find(District, { region: req.query.region });
	});
}

export default route;