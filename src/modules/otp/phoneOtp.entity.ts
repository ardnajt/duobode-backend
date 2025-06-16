import crypto from 'crypto';
import { Embeddable, Embedded, Entity, OneToOne, Property } from '@mikro-orm/sqlite';
import { CommonEntity } from '@modules/common/common.entity';
import dayjs from 'dayjs';
import { User } from '@modules/user/user.entity';

@Embeddable()
class Phone {
	@Property()
	prefix?: string;

	@Property()
	number?: string;
}

@Entity()
export class PhoneOtp extends CommonEntity {
	@OneToOne(() => User)
	user: User;

	@Embedded()
	phone: Phone = new Phone();

	@Property()
	code: string;

	@Property()
	expiredAt: Date = dayjs().add(5, 'minutes').toDate();

	constructor(user: User, phone: Phone) {
		super();
		this.user = user;
		this.phone = phone;

		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		let code = '';
		for (let i = 0; i < 5; i++) {
			const idx = crypto.randomInt(0, chars.length);
			code += chars[idx];
		}
		this.code = code;
	}
}