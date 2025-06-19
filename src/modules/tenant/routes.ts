import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { initORM } from '@orm';
import { Type } from '@sinclair/typebox';
import { Tenant, TenantOccupation, TenantType } from './tenant.entity';
import { User } from '@modules/user/user.entity';
import District from '@modules/district/district.entity';
import { Utils } from '@app/utils';

const route: FastifyPluginAsyncTypebox = async app => {
	const db = await initORM();

	app.get('/self', {
		onRequest: [app.authenticate],
		schema: {
			tags: ['tenant'],
			security: [{ BearerAuth: [] }]
		}
	}, async (req, res) => {
		const em = db.em.fork();
		return await em.findOne(Tenant, { user: req.user.id }, { populate: ['districts'] });
	});

	app.get('', {
		schema: {
			tags: ['tenant'],
		}
	}, async (req, res) => {
		const em = db.em.fork();
		return await em.find(Tenant, {}, { populate: ['user', 'districts'], exclude: ['user.password'] });
	});

	app.post('', {
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

		let tenant = await em.findOne(Tenant, { user: req.user.id });
		if (!tenant) {
			const user = await em.findOneOrFail(User, req.user.id);
			tenant = new Tenant(user);
		}

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

	app.put('/imageurl', {
		onRequest: [app.authenticate],
		schema: {
			tags: ['tenant'],
			security: [{ BearerAuth: [] }]
		}
	}, async (req, res) => {
		const em = db.em.fork();

		const data = await req.file();
		if (!data) return res.status(400).send({ message: 'File missing.' });

		let tenant = await em.findOne(Tenant, { user: req.user.id });
		if (!tenant) {
			const user = await em.findOneOrFail(User, req.user.id);
			tenant = new Tenant(user);
		}
		else if (tenant.imageUrl) await Utils.deleteFile(tenant.imageUrl);

		const url = await Utils.uploadFile(data, 'tenant');
		tenant.imageUrl = url;
		await em.persistAndFlush(tenant);

		return tenant;
	});

	app.delete('/imageurl', {
		onRequest: [app.authenticate],
		schema: {
			tags: ['tenant'],
			security: [{ BearerAuth: [] }]
		}
	}, async (req, res) => {
		const em = db.em.fork();
		const tenant = await em.findOne(Tenant, { user: req.user.id });
		
		if (tenant?.imageUrl) {
			await Utils.deleteFile(tenant.imageUrl);
			tenant.imageUrl = undefined;
			await em.persistAndFlush(tenant);
		}

		return tenant;
	});
	
}

export default route;