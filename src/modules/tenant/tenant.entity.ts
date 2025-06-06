import { Collection, Entity, Enum, ManyToMany, OneToOne, Property } from '@mikro-orm/sqlite';
import { CommonEntity } from '@modules/common/common.entity';
import { District } from '@modules/district/district.entity';
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

	@Property()
	budget?: number;

	@ManyToMany()
	districts = new Collection<District>(this);

	constructor(user: User, type: TenantType, occupation: TenantOccupation) {
		super();
		this.user = user;
		this.type = type;
		this.occupation = occupation;
	}
}