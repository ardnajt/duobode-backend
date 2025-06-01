import { Embeddable, Embedded, Entity, Enum, OneToOne, Property } from '@mikro-orm/sqlite';
import { CommonEntity } from '@modules/common/common.entity';
import { User } from '@modules/user/user.entity';

export enum TenantType {
	MALE = 'male',
	FEMALE = 'female',
	COUPLE = 'couple'
}

export enum TenantOccupation {
	PROFESSIONAL = 'professional',
	STUDENT = 'student'
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

@Entity()
export class Tenant extends CommonEntity {
	@OneToOne(() => User)
	user: User;

	@Enum()
	type: TenantType;

	@Enum()
	occupation: TenantOccupation;

	@Property()
	bio?: string;

	@Embedded()
	preferences?: TenantPreferences;

	constructor(user: User, type: TenantType, occupation: TenantOccupation) {
		super();
		this.user = user;
		this.type = type;
		this.occupation = occupation;
	}
}