import crypto from 'crypto';
import { Entity, Property } from '@mikro-orm/sqlite';
import { CommonEntity } from '@modules/common/common.entity';

@Entity()
export class Otp extends CommonEntity {
	@Property()
	code: string;

	@Property()
	email: string;

	@Property()
	expirationTimestamp: number;

	constructor(email: string) {
		super();
		this.email = email;
		this.code = crypto.randomInt(0, 999999).toString();
		this.expirationTimestamp =  Date.now() + (5 * 60 * 1000);
	}
}