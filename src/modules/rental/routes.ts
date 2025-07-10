import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { User } from '@modules/user/user.entity';
import { initORM } from '@orm';
import { Type } from '@sinclair/typebox';
import Rental, { RentalDuration, PropertyType, RentalState, RentalTenantPreferredType, RentalType, RentalTenantPreferredOccupation } from './rental.entity';
import District from '@modules/district/district.entity';
import RentalImage from './rental-image.entity';
import { Utils } from '@app/utils';
import { FilterQuery, FilterValue } from '@mikro-orm/sqlite';

const route: FastifyPluginAsyncTypebox = async app => {
	const db = await initORM();

	app.get('', {
		schema: {
			tags: ['rental'],
			description: "Returns 10 rentals based on the provided filter",
			querystring: Type.Object({
				type: Type.Enum(RentalType, { examples: Object.values(RentalType).filter(r => typeof r == 'number') }),
				page: Type.Optional(Type.Number({ default: 1 })),
				gender: Type.Optional(Type.Array(Type.Number())),
				durations: Type.Optional(Type.Array(Type.Number())),
				pax: Type.Optional(Type.Array(Type.Number())),
				furnished: Type.Optional(Type.Array(Type.Boolean())),
				shared: Type.Optional(Type.Array(Type.Boolean())),
				properties: Type.Optional(Type.Array(Type.Number())),
				districts: Type.Optional(Type.Array(Type.Number())),
				min: Type.Optional(Type.Number()),
				max: Type.Optional(Type.Number())
			})
		}
	}, async (req, res) => {
		if (!req.query.page) req.query.page = 1;

		const em = db.em.fork();
		const limit = 10;

		const where: FilterQuery<Rental> = { state: RentalState.ACTIVE, type: req.query.type };
		if (req.query.durations) where.duration = { $in: req.query.durations };
		if (req.query.pax) where.pax = { $in: req.query.pax };
		if (req.query.properties) where.property = { $in: req.query.properties };
		if (req.query.districts) where.location = { district: { id: { $in: req.query.districts } } };

		// Filtering specifically for preferences
		const preferences: Record<any, any> = {};
		if (req.query.gender) preferences.type = { $in: req.query.gender };
		if (Object.keys(preferences).length != 0) where.preferences = preferences;
		
		// Filtering specifically for features
		const features: Record<any, any> = {};
		if (req.query.furnished) features.furnished = { $in: req.query.furnished } ;
		if (req.query.shared && req.query.type != RentalType.PROPERTY) features.shared = { $in: req.query.shared };
		if (Object.keys(features).length != 0) where.features = features;

		const rent: FilterValue<number> = {
			$gte: req.query.min,
			$lte: req.query.max
		};
		if (req.query.min == undefined) delete rent.$gte;
		if (req.query.max == undefined) delete rent.$lte;

		const count = await em.count(Rental, where);

		const rentals = await em.find(Rental, where, {
			limit,
			offset: (req.query.page - 1) * limit,
			orderBy: { createdAt: 'desc' },
		});

		return { count, rentals };
	});

	app.post('', {
		onRequest: [app.authenticate],
		schema: {
			tags: ['rental'],
			security: [{ BearerAuth: [] }],
		}
	}, async (req, res) => {
		const em = db.em.fork();

		const count = await em.count(Rental, { owner: req.user.id });
		if (count >= 3) return res.status(401).send('Exceeded rental limit');

		const owner = await em.findOneOrFail(User, req.user.id);
		const rental = new Rental(owner);
		await em.persistAndFlush(rental);

		return rental.id;
	});

	app.get('/self', {
		onRequest: [app.authenticate],
		schema: {
			tags: ['rental'],
			security: [{ BearerAuth: [] }],
		}
	}, async (req, res) => {
		const em = db.em.fork();

		const rentals = await em.find(Rental, { owner: req.user.id }, { exclude: ['owner.email', 'owner.password'], orderBy: { createdAt: 'DESC' } });
		return rentals;
	});

	app.get('/:id', {
		schema: {
			tags: ['rental'],
			security: [{ BearerAuth: [] }],
			params: Type.Object({ id: Type.Number() })
		}
	}, async (req, res) => {
		const em = db.em.fork();

		const rental = await em.findOneOrFail(Rental, req.params.id, { exclude: ['owner.email', 'owner.password'] });
		return rental;
	});

	app.delete('/:id', {
		schema: {
			tags: ['rental'],
			security: [{ BearerAuth: [] }],
			params: Type.Object({ id: Type.Number() })
		}
	}, async (req, res) => {
		const em = db.em.fork();
		const rental = await em.findOneOrFail(Rental, req.params.id);
		await Utils.deleteFolder(`/uploads/images/rental/${req.params.id}`);
		await em.removeAndFlush(rental);
	})

	app.get('/recent', {
		schema: {
			tags: ['rental'],
			description: 'Fetch recently created rentals.'
		}
	}, async (req, res) => {
		const em = db.em.fork();

		const rentals = await em.find(Rental, { state: RentalState.ACTIVE }, {
			orderBy: { createdAt: 'DESC' },
			exclude: ['owner.email', 'owner.password'],
			limit: 6
		});

		return rentals;
	});

	app.put('/update/:id', {
		onRequest: [app.authenticate],
		schema: {
			tags: ['rental'],
			security: [{ BearerAuth: [] }],
			params: Type.Object({ id: Type.Number() }),
			body: Type.Object({
				pax: Type.Optional(Type.Number()),
				title: Type.Optional(Type.String()),
				state: Type.Optional(Type.Enum(RentalState)),
				description: Type.Optional(Type.String()),
				type: Type.Optional(Type.Enum(RentalType)),
				property: Type.Optional(Type.Enum(PropertyType)),
				duration: Type.Optional(Type.Enum(RentalDuration)),
				rent: Type.Optional(Type.Number()),
				location: Type.Optional(Type.Object({
					district: Type.Optional(Type.Number()),
					address: Type.Optional(Type.String())
				})),
				features: Type.Optional(Type.Object({
					aircon: Type.Optional(Type.Boolean()),
					furnished: Type.Optional(Type.Boolean()),
					cooking: Type.Optional(Type.Boolean()),
					internet: Type.Optional(Type.Boolean()),
					shared: Type.Optional(Type.Boolean())
				})),
				preferences: Type.Optional(Type.Object({
					type: Type.Optional(Type.Enum(RentalTenantPreferredType)),
					occupation: Type.Optional(Type.Enum(RentalTenantPreferredOccupation))
				}))
			})
		}
	}, async (req, res) => {
		const em = db.em.fork();

		const rental = await em.findOneOrFail(Rental, req.params.id);
		if (rental.owner.id != req.user.id) return res.status(401).send({ message: "You do not have the permissions to modify this rental." });

		if (req.body.state != undefined) rental.state = req.body.state;
		if (req.body.pax != undefined) rental.pax = req.body.pax;
		if (req.body.title != undefined) rental.title = req.body.title;
		if (req.body.description != undefined) rental.description = req.body.description;
		if (req.body.type != undefined) rental.type = req.body.type;
		if (req.body.property != undefined) rental.property = req.body.property;
		if (req.body.duration != undefined) rental.duration = req.body.duration;
		if (req.body.rent != undefined) rental.rent = req.body.rent;
		
		rental.features.aircon = req.body.features?.aircon ?? false;
		rental.features.furnished = req.body.features?.furnished ?? false;
		rental.features.cooking = req.body.features?.cooking ?? false;
		rental.features.internet = req.body.features?.internet ?? false;
		if (rental.type == RentalType.ROOM) rental.features.shared = req.body.features?.shared ?? false;

		if (req.body.location != undefined) {
			if (req.body.location.district != undefined) {
				const district = em.getReference(District, req.body.location.district);
				rental.location.district = district;
			}
			if (req.body.location.address != undefined) rental.location.address = req.body.location.address;
			// Validates whether the postal matches with the latitude & longitude.
			// if (await rental.validateLocation(req.body.location)) {
				// rental.location = req.body.location;

				// const response = await axios.get<{ pln_area_n: string }[]>(`https://www.onemap.gov.sg/api/public/popapi/getPlanningarea?latitude=${rental.location.latitude}&longitude=${rental.location.longitude}`, {
				// 	headers: { 'Authorization': process.env.API_ONEMAP_ACCESS_KEY }
				// });

				// If it does, set the district with the provided latitude and longitude.
				// rental.location.district = response.data[0].pln_area_n;
			// }
		}

		if (req.body.preferences != undefined) {
			if (req.body.preferences.type != undefined) rental.preferences.type = req.body.preferences.type;
			if (req.body.preferences.occupation != undefined) rental.preferences.occupation = req.body.preferences.occupation;
		}

		await em.persistAndFlush(rental);
		return rental;
	});

	app.post('/image/:id', {
		onRequest: [app.authenticate],
		schema: {
			tags: ['rental'],
			security: [{ BearerAuth: [] }],
			description: 'Upload an image for a rental',
			params: Type.Object({ id: Type.Number() })
		}
	}, async (req, res) => {
		const em = db.em.fork();

		const data = await req.file();
		if (!data) return res.status(404).send({ message: 'File missing' });

		const rental = await em.findOneOrFail(Rental, req.params.id);
		if (rental.owner.id != req.user.id) return res.status(403).send({ message: 'Unauthorized' });
		if (rental.images.length > 5) return res.status(400).send({ message: 'Exceeded image limit' });
		const priority = rental.images.length + 1;
		
		const url = await Utils.uploadFile(data, `/rental/${req.params.id}`);
		const image = new RentalImage(rental, priority, url);
		rental.images.add(image);
		await em.persistAndFlush(rental);

		return rental;
	});

	app.delete('/image/:id/:imageId', {
		onRequest: [app.authenticate],
		schema: {
			tags: ['rental'],
			security: [{ BearerAuth: [] }],
			description: 'Delete image by its ID from rental',
			params: Type.Object({
				id: Type.Number(),
				imageId: Type.Number()
			})
		}
	}, async (req, res) => {
		const em = db.em.fork();

		const rental = await em.findOneOrFail(Rental, req.params.id);
		if (rental.owner.id != req.user.id) return res.status(403).send({ message: 'Unauthorized' });

		const image = rental.images.find(i => i.id == req.params.imageId);
		if (image) {
			await Utils.deleteFile(image.imageUrl);
			rental.images.remove(image);

			rental.images
				.filter(img => img.priority > image.priority)
				.sort((a, b) => a.priority - b.priority)
				.forEach(img => img.priority--);
			await em.persistAndFlush(rental);
		}

		return rental;
	});
}

export default route;