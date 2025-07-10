import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { initORM } from '@orm';
import { Type } from '@sinclair/typebox';
import { Tenant, TenantOccupation, TenantState, TenantType } from './tenant.entity';
import { User } from '@modules/user/user.entity';
import District from '@modules/district/district.entity';
import { Utils } from '@app/utils';
import { RentalType } from '@modules/rental/rental.entity';

const route: FastifyPluginAsyncTypebox = async app => {
	const db = await initORM();

	app.get('/:id', {
		schema: {
			tags: ['tenant'],
			description: "Fetch a tenant by their ID.",
			params: Type.Object({ id: Type.Number() })
		}
	}, async (req, res) => {
		const em = db.em.fork();
		const tenant = await em.findOneOrFail(Tenant, { user: req.params.id }, { populate: ['user', 'districts'], exclude: ['user.email', 'user.password'] });
		return tenant;
	})

	app.get('/self', {
		onRequest: [app.authenticate],
		schema: {
			tags: ['tenant'],
			description: 'Fetch tenant details for the authenticated user.',
			security: [{ BearerAuth: [] }]
		}
	}, async (req, res) => {
		const em = db.em.fork();
		
		const tenant = await em.findOne(Tenant, { user: req.user.id }, { populate: ['user', 'districts'], exclude: ['user.email', 'user.password'] });

		if (tenant) return tenant;
		else {
			const user = await em.findOneOrFail(User, req.user.id);
			return new Tenant(user);
		}
	});

	app.get('', {
		schema: {
			tags: ['tenant'],
			description: "Returns 10 tenants based on the provided filter",
			querystring: Type.Object({
				page: Type.Optional(Type.Number({ default: 1 })),
				types: Type.Optional(Type.Array(Type.Number())),
				occupations: Type.Optional(Type.Array(Type.Number())),
				districts: Type.Optional(Type.Array(Type.Number())),
				min: Type.Optional(Type.Number()),
				max: Type.Optional(Type.Number())
			})
		}
	}, async (req, res) => {
		if (!req.query.page) req.query.page = 1;

		const em = db.em.fork();
		const limit = 10;

		const qb = em.createQueryBuilder(Tenant, 't')
			.leftJoin('t.districts', 'd')
			.where({ state: TenantState.ACTIVE })
			.limit(limit)
			.offset((req.query.page - 1) * limit)
			.orderBy({ createdAt: 'desc' });

		if (req.query.types) qb.andWhere({ type: { $in: req.query.types }});
		if (req.query.occupations) qb.andWhere({ occupation: { $in: req.query.occupations } });
		if (req.query.districts) qb.andWhere({ 'd.id': { $in: req.query.districts }});
		if (req.query.min != undefined) qb.andWhere({ budget: { $gte: req.query.min } });
		if (req.query.max != undefined) qb.andWhere({ budget: { $lte: req.query.max } });

		const clone = qb.clone();
		const count = await qb.getCount();

		clone
			.limit(limit)
			.offset((req.query.page - 1) * limit);

		const tenants = await clone.getResult();
		await em.populate(tenants, ['user', 'districts'], { exclude: ['user.email', 'user.password'] });
		return { count, tenants };
	});

	app.get('/recent', {
		schema: {
			tags: ['tenant'],
			description: 'Fetch recently created tenants.'
		}
	}, async (req, res) => {
		const em = db.em.fork();

		const tenants = await em.find(Tenant, { state: TenantState.ACTIVE }, {
			populate: ['user', 'districts'],
			orderBy: { createdAt: 'DESC' },
			exclude: ['user.email', 'user.password'],
			limit: 6
		});

		return tenants;
	});

	app.post('', {
		onRequest: [app.authenticate],
		schema: {
			tags: ['tenant'],
			description: 'Update tenant details. If tenant does not exist for the user, it will be created.',
			security: [{ BearerAuth: [] }],
			body: Type.Object({
				type: Type.Optional(Type.Enum(TenantType)),
				state: Type.Optional(Type.Enum(TenantState)),
				rental: Type.Optional(Type.Enum(RentalType)),
				occupation: Type.Optional(Type.Enum(TenantOccupation)),
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
		if (req.body.state != undefined) tenant.state = req.body.state;
		if (req.body.rental != undefined) tenant.rental = req.body.rental;
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
			description: 'Upload an image for the tenant.',
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