import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { initORM } from '@orm';
import Region from './region.entity';

const route: FastifyPluginAsyncTypebox = async (app) => {
	const db = await initORM();

	app.get('', {
		schema: {
			tags: ['region']
		}
	}, async (req, res) => {
		const em = db.em.fork();
		return await em.find(Region, {});
	});
}

export default route;