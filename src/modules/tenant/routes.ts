import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { initORM } from '@orm';
import { Type } from '@sinclair/typebox';
import { Tenant, TenantOccupation, TenantType } from './tenant.entity';
import { User } from '@modules/user/user.entity';
import { District } from '@modules/district/district.entity';

const route: FastifyPluginAsyncTypebox = async app => {
	const db = await initORM();

	app.get('', {
		onRequest: [app.authenticate],
		schema: {
			tags: ['tenant'],
			security: [{ BearerAuth: [] }]
		}
	},async (req, res) => {
			const em = db.em.fork();
			return await em.find(Tenant, {}, { populate: ['user', 'districts'], exclude: ['user.password'] });
	});

	app.post('/create', {
		onRequest: [app.authenticate],
		schema: {
			tags: ['tenant'],
			security: [{ BearerAuth: [] }],
			body: Type.Object({
				type: Type.Enum(TenantType),
				occupation: Type.Enum(TenantOccupation),
				bio: Type.Optional(Type.String()),
				budget: Type.Optional(Type.Number()),
				districts: Type.Optional(Type.Array(Type.Number()))
			})
		}
	}, async (req, res) => {
		const em = db.em.fork();

		const user = await em.findOneOrFail(User, req.user.id);

		const tenant = new Tenant(user, req.body.type, req.body.occupation);
		if (req.body.bio != undefined) tenant.bio = req.body.bio;
		if (req.body.budget != undefined) tenant.budget = req.body.budget;

		if (req.body.districts?.length) {
			const districts = req.body.districts.map(id => em.getReference(District, id));
			if (districts.length) tenant.districts.set(districts);
		}

		await em.persistAndFlush(tenant);
		return tenant;
	});

	app.put('/update', {
		onRequest: [app.authenticate],
		schema: {
			tags: ['tenant'],
			security: [{ BearerAuth: [] }],
			body: Type.Object({
				type: Type.Optional(Type.Enum(TenantType)),
				occupation: Type.Optional(Type.Enum(TenantOccupation)),
				bio: Type.Optional(Type.String()),
				budget: Type.Optional(Type.Number()),
				districts: Type.Optional(Type.Array(Type.Number()))
			})
		}
	}, async (req, res) => {
		const em = db.em.fork();

		const tenant = await em.findOneOrFail(Tenant, { user: req.user.id });		
		if (req.body.type != undefined) tenant.type = req.body.type;
		if (req.body.occupation != undefined) tenant.occupation = req.body.occupation;
		if (req.body.bio != undefined) tenant.bio = req.body.bio;
		if (req.body.budget != undefined) tenant.budget = req.body.budget;

		if (req.body.districts?.length) {
			const districts = req.body.districts.map(id => em.getReference(District, id));
			if (districts.length) tenant.districts.set(districts);
		}

		await em.persistAndFlush(tenant);
		return tenant;
	});
}

export default route;