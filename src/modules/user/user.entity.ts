import { BeforeCreate, BeforeUpdate, Cascade, Collection, Embeddable, Embedded, Entity, Enum, EventArgs, OneToMany, OneToOne, Property } from '@mikro-orm/sqlite';
import { CommonEntity } from '@modules/common/common.entity';
import Rental from '@modules/rental/rental.entity';

import { hash, verify } from 'argon2';
import { FastifyInstance } from 'fastify';

export enum Method {
	EMAIL = 'email',
	SOCIAL = 'social'
}

@Embeddable()
export class Phone {
	@Property()
	number?: string;

	@Property()
	verified: boolean = false;
}

@Entity()
export class User extends CommonEntity {
	@Property({ unique: true })
	email: string;

	@Property()
	name: string;
	
	@Property()
	password?: string;

	@Enum()
	method: Method;

	@Embedded()
	phone: Phone = new Phone();

	@OneToMany(() => Rental, rental => rental.owner, { cascade: [Cascade.ALL] })
	rentals = new Collection<Rental>(this);
	
	constructor(email: string, name: string, method: Method) {
		super();
		this.email = email;
		this.name = name;
		this.method = method;
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