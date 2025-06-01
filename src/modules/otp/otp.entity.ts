import crypto from 'crypto';
import { Entity, Property } from '@mikro-orm/sqlite';
import { CommonEntity } from '@modules/common/common.entity';
import dayjs from 'dayjs';

@Entity()
export class Otp extends CommonEntity {
	@Property()
	code: string;

	@Property()
	email: string;

	@Property()
	expiredAt: Date = dayjs().add(5, 'minutes').toDate();

	constructor(email: string) {
		super();
		this.email = email;

		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		let code = '';
		for (let i = 0; i < 6; i++) {
			const idx = crypto.randomInt(0, chars.length);
			code += chars[idx];
		}
		this.code = code;
	}
}