import { BeforeCreate, BeforeUpdate, Embeddable, Embedded, Entity, Enum, EventArgs, Property } from '@mikro-orm/sqlite';
import { CommonEntity } from '@modules/common/common.entity';

import { hash, verify } from 'argon2';

export enum TenantType {
	MALE = 0,
	FEMALE = 1,
	MIXED = 2
}

export enum TenantOccupation {
	PROFESSIONAL = 0,
	STUDENT = 1
}

@Embeddable()
export class Tenant {
	@Property()
	pax?: number;

	@Enum()	
	type?: TenantType;

	@Enum()
	occupation?: TenantOccupation;

	@Property()
	preferredRegion?: string;

	@Property()
	preferredArea?: string;

	@Property()
	budgetMin?: number;

	@Property()
	budgetMax?: number;
}

@Entity()
export class User extends CommonEntity<'bio'> {
	@Property()
	name: string;

	@Property({ unique: true })
	email: string;
	
	@Property()
	password: string;

	@Property({ unique: true })
	phone: string;

	@Embedded()
	tenant?: Tenant;

	@Property()
	age: number;

	@Property()
	bio?: string;
	
	constructor(name: string, email: string, password: string, phone: string, age: number) {
		super();
		this.name = name;
		this.email = email;
		this.password = password;
		this.phone = phone;
		this.age = age;
	}

	@BeforeCreate()
	@BeforeUpdate()
	async hashPassword(args: EventArgs<User>) {
		// Hash only if password value was updated.
		const password = args.changeSet?.payload.password;
		if (password) this.password = await hash(password);
	}
	
	async verifyPassword(password: string) {
		return verify(this.password, password);
	}
}