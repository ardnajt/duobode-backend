import { Embeddable, Embedded, Entity, Enum, ManyToOne, Property } from '@mikro-orm/sqlite';
import { CommonEntity } from '@modules/common/common.entity';
import { User } from '@modules/user/user.entity';
import axios from 'axios';

export enum RentalType {
	ROOM = 'room',
	UNIT = 'whole unit'
}

export enum PropertyType {
	HDB = 'hdb',
	CONDO = 'condo',
	LANDED = 'landed'
}

export enum Duration {
	SHORT_TERM = 'short',
	LONG_TERM = 'long'
}

export enum RentalState {
	DRAFT = 'draft',
	ACTIVE = 'active',
	INACTIVE = 'inactive'
}

@Embeddable()
export class Location {
	@Property()
	postal?: string;

	@Property()
	latitude?: number;

	@Property()
	longitude?: number;

	@Property()
	district?: string;
}

@Entity()
export default class Rental extends CommonEntity {
	@ManyToOne(() => User, { eager: true })
	owner: User;

	@Enum()
	state: RentalState = RentalState.DRAFT;
	
	@Property()
	title?: string;

	@Property()
	description?: string;

	@Property()
	pax?: number;

	@Enum()
	type?: RentalType;

	@Enum()
	property?: PropertyType;

	@Enum()
	duration?: Duration; 

	@Property()
	rent?: number;

	@Property()
	furnished?: boolean;

	@Embedded()
	location?: Location;

	constructor(owner: User) {
		super();
		this.owner = owner;
	}

	/** Utilises reverse geocoding to ensure that the provided `postal` matches with the `latitude` and `longitude`. */
	async validateLocation(location: Omit<Location, 'district'>) {
		const response = await axios.get<{ GeocodeInfo: { POSTALCODE: string }[] }>(`https://www.onemap.gov.sg/api/public/revgeocode?location=${location.latitude},${location.longitude}`, { headers: {
			'Authorization': process.env.API_ONEMAP_ACCESS_KEY
		}}).catch(() => null);

		return !!response && response.data.GeocodeInfo.some(i => i.POSTALCODE == location.postal);
	}
}