import { Entity, ManyToOne, Property } from '@mikro-orm/sqlite';
import { CommonEntity } from '@modules/common/common.entity';
import { User } from '@modules/user/user.entity';

export enum PropertyType {
	HDB = 0,
	CONDO = 1,
	LANDED = 2
}

export enum StayDuration {
	SHORT_TERM = 0,
	LONG_TERM = 1
}

@Entity()
export default class Rental extends CommonEntity {
	@ManyToOne(() => User)
	owner: User;

	@Property()
	type: PropertyType;

	@Property()
	stayDuration: StayDuration; 

	@Property()
	rent: number;

	@Property()
	postalCode: string;

	constructor(owner: User, type: PropertyType, stayDuration: StayDuration, rent: number, postalCode: string ) {
		super();
		this.owner = owner;
		this.type = type;
		this.stayDuration = stayDuration;
		this.rent = rent;
		this.postalCode = postalCode;
	}
}