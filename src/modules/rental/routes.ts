import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { User } from '@modules/user/user.entity';
import { initORM } from '@orm';
import { Type } from '@sinclair/typebox';
import Rental, { RentalDuration, PropertyType, RentalState, RentalTenantPreferredType, RentalType, RentalTenantPreferredOccupation } from './rental.entity';
import axios from 'axios';
import District from '@modules/district/district.entity';
import { TenantOccupation } from '@modules/tenant/tenant.entity';

const route: FastifyPluginAsyncTypebox = async app => {
	const db = await initORM();

	app.post('', {
		onRequest: [app.authenticate],
		schema: {
			tags: ['rental'],
			security: [{ BearerAuth: [] }],
		}
	}, async (req, res) => {
		const em = db.em.fork();

		const owner = await em.findOneOrFail(User, req.user.id);
		const rental = new Rental(owner);
		await em.persistAndFlush(rental);

		return rental.id;
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
				tenantPreferences: Type.Optional(Type.Object({
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

		if (req.body.tenantPreferences != undefined) {
			if (req.body.tenantPreferences.type != undefined) rental.preferences.type = req.body.tenantPreferences.type;
			if (req.body.tenantPreferences.occupation != undefined) rental.preferences.occupation = req.body.tenantPreferences.occupation;
		}

		await em.persistAndFlush(rental);
		return rental;
	});
}

export default route;