import { BeforeCreate, BeforeUpdate, Cascade, Collection, Embeddable, Embedded, Entity, EventArgs, OneToMany, OneToOne, Property } from '@mikro-orm/sqlite';
import { CommonEntity } from '@modules/common/common.entity';
import Rental from '@modules/rental/rental.entity';
import { Tenant } from '@modules/tenant/tenant.entity';

import { hash, verify } from 'argon2';
import { FastifyInstance } from 'fastify';

@Embeddable()
export class Social {
	@Property()
	googleId?: string;

	@Property()
	facebookId?: string;
}

@Entity()
export class User extends CommonEntity {
	@Property({ unique: true })
	email: string;

	@Property()
	name?: string;
	
	@Property()
	password?: string;

	@Embedded()
	social?: Social;

	@OneToOne(() => Tenant)
	tenant?: Tenant;

	@OneToMany(() => Rental, rental => rental.owner, { eager: true, cascade: [Cascade.ALL] })
	rentals = new Collection<Rental>(this);
	
	constructor(email: string) {
		super();
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