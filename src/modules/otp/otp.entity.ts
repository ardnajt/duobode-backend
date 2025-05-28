import crypto from 'crypto';
import { Entity, Property } from '@mikro-orm/sqlite';
import { CommonEntity } from '@modules/common/common.entity';
import dayjs from 'dayjs';

@Entity()
export class Otp extends CommonEntity {
	@Property()
	code: string = crypto.randomInt(0, 999999).toString();

	@Property()
	email: string;

	@Property()
	expiredAt: Date = dayjs().add(5, 'minutes').toDate();

	constructor(email: string) {
		super();
		this.email = email;
	}
}