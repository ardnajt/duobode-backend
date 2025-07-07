import { Cascade, Collection, Embeddable, Embedded, Entity, Enum, ManyToOne, OneToMany, Property } from '@mikro-orm/sqlite';
import { CommonEntity } from '@modules/common/common.entity';
import District from '@modules/district/district.entity';
import { User } from '@modules/user/user.entity';
import RentalImage from './rental-image.entity';

export enum RentalType {
	ROOM,
	PROPERTY
}

export enum PropertyType {
	HDB,
	CONDO,
	LANDED
}

export enum RentalDuration {
	SHORT_TERM,
	LONG_TERM
}

export enum RentalState {
	DRAFT,
	ACTIVE,
	INACTIVE
}

export enum RentalTenantPreferredOccupation {
	NONE,
	PROFESSIONAL,
	STUDENT
}

export enum RentalTenantPreferredType {
	NONE,
	MALE,
	FEMALE,
	COUPLE,
	NOCOUPLE
}

@Embeddable()
export class RentalLocation {
	@ManyToOne(() => District, { eager: true })
	district?: District;

	@Property()
	address?: string;
}

@Embeddable()
export class RentalFeatures {
	@Property()
	furnished = false;

	@Property()
	internet = false;

	@Property()
	aircon = false;
	
	@Property()
	cooking = false;

	@Property()
	shared = false;
}

@Embeddable()
export class RentalPreferences {
	@Property()
	type = RentalTenantPreferredType.NONE;

	@Property()
	occupation = RentalTenantPreferredOccupation.NONE;
}

@Entity()
export default class Rental extends CommonEntity {
	@ManyToOne(() => User, { eager: true })
	owner: User;

	@Enum()
	state = RentalState.DRAFT;
	
	@Property()
	title?: string;

	@Property()
	description?: string;

	@Property()
	pax = 1;

	@Enum()
	type = RentalType.ROOM;

	@Enum()
	property = PropertyType.HDB;

	@Enum()
	duration = RentalDuration.LONG_TERM;

	@Property()
	rent?: number;

	@Embedded()
	location = new RentalLocation();

	@Embedded()
	features = new RentalFeatures();

	@Embedded()
	preferences = new RentalPreferences();

	@OneToMany(() => RentalImage, i => i.rental, { eager: true, cascade: [Cascade.ALL], orphanRemoval: true })
	images = new Collection<RentalImage>(this);

	constructor(owner: User) {
		super();
		this.owner = owner;
	}

	/** Utilises reverse geocoding to ensure that the provided `postal` matches with the `latitude` and `longitude`. */
	// async validateLocation(location: Omit<RentalLocation, 'district'>) {
	// 	const response = await axios.get<{ GeocodeInfo: { POSTALCODE: string }[] }>(`https://www.onemap.gov.sg/api/public/revgeocode?location=${location.latitude},${location.longitude}`, { headers: {
	// 		'Authorization': process.env.API_ONEMAP_ACCESS_KEY
	// 	}}).catch(() => null);

	// 	return !!response && response.data.GeocodeInfo.some(i => i.POSTALCODE == location.postal);
	// }
}