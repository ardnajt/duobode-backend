import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { User } from '@modules/user/user.entity';
import { initORM } from '@orm';
import { Type } from '@sinclair/typebox';
import Rental, { Duration, PropertyType, RentalType } from './rental.entity';
import axios from 'axios';

const route: FastifyPluginAsyncTypebox = async app => {
	const db = await initORM();

	app.post('/create', {
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

		return rental;
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
				description: Type.Optional(Type.String()),
				type: Type.Optional(Type.Enum(RentalType)),
				property: Type.Optional(Type.Enum(PropertyType)),
				duration: Type.Optional(Type.Enum(Duration)),
				rent: Type.Optional(Type.Number()),
				furnished: Type.Optional(Type.Boolean()),
				location: Type.Optional(Type.Object({
					postal: Type.String(),
					latitude: Type.Number(),
					longitude: Type.Number()
				}))
			})
		}
	}, async (req, res) => {
		const em = db.em.fork();

		const rental = await em.findOneOrFail(Rental, req.params.id);
		if (rental.owner.id != req.user.id) return res.status(401).send({ message: "You do not have the permissions to modify this rental." });

		if (req.body.pax != undefined) rental.pax = req.body.pax;
		if (req.body.title != undefined) rental.title = req.body.title;
		if (req.body.description != undefined) rental.description = req.body.description;
		if (req.body.type != undefined) rental.type = req.body.type;
		if (req.body.property != undefined) rental.property = req.body.property;
		if (req.body.duration != undefined) rental.duration = req.body.duration;
		if (req.body.rent != undefined) rental.rent = req.body.rent;
		if (req.body.furnished != undefined) rental.furnished = req.body.furnished;

		if (req.body.location != undefined) {
			// Validates whether the postal matches with the latitude & longitude.
			if (await rental.validateLocation(req.body.location)) {
				rental.location = req.body.location;

				const response = await axios.get<{ pln_area_n: string }[]>(`https://www.onemap.gov.sg/api/public/popapi/getPlanningarea?latitude=${rental.location.latitude}&longitude=${rental.location.longitude}`, {
					headers: { 'Authorization': process.env.API_ONEMAP_ACCESS_KEY }
				});

				// If it does, set the district with the provided latitude and longitude.
				rental.location.district = response.data[0].pln_area_n;
			}
		}

		await em.persistAndFlush(rental);
		return rental;
	});
}

export default route;