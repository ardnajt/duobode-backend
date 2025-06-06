import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { initORM } from '@orm';
import { District } from './district.entity';

const route: FastifyPluginAsyncTypebox = async (app) => {
	const db = await initORM();

	app.get('', async (req, res) => {
		const em = db.em.fork();
		return await em.find(District, {});
	});
}

export default route;