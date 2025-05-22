import { BeforeCreate, BeforeUpdate, Cascade, Collection, Embeddable, Embedded, Entity, Enum, EventArgs, OneToMany, Property } from '@mikro-orm/sqlite';
import { CommonEntity } from '@modules/common/common.entity';
import Rental from '@modules/rental/rental.entity';

import { hash, verify } from 'argon2';
import { FastifyInstance } from 'fastify';

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
export class TenantPreferences {
	@Property()
	region?: string;

	@Property()
	district?: string;

	@Property()
	budget?: number;
}

@Embeddable()
export class Tenant {
	@Property()
	pax?: number;

	@Enum()	
	type?: TenantType;

	@Property()
	bio?: string;

	@Enum()
	occupation?: TenantOccupation;

	@Embedded()
	preferred?: TenantPreferences;
}

@Embeddable()
export class Social {
	@Property()
	googleId?: string;
}

@Entity()
export class User extends CommonEntity {
	@Property()
	name: string;

	@Property({ unique: true })
	email: string;
	
	@Property()
	password?: string;

	@Embedded()
	social?: Social;

	@Embedded()
	tenant?: Tenant;

	@OneToMany(() => Rental, rental => rental.owner, { eager: true, cascade: [Cascade.ALL] })
	rentals = new Collection<Rental>(this);
	
	constructor(name: string, email: string) {
		super();
		this.name = name;
		this.email = email;
	}

	@BeforeCreate()
	@BeforeUpdate()
	async hashPassword(args: EventArgs<User>) {
		// Hash only if password value was updated.
		const password = args.changeSet?.payload.password;
		if (password) this.password = await hash(password);
	}
	
	/** Nullable only if social login methods were used. */
	async verifyPassword(password: string) {
		if (!this.password) return null;
		return verify(this.password, password);
	}

	generateToken(app: FastifyInstance) {
		return app.jwt.sign({ id: this.id, email: this.email });
	}
}