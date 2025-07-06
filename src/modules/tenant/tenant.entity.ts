import { Collection, Entity, Enum, ManyToMany, OneToOne, Property } from '@mikro-orm/sqlite';
import { CommonEntity } from '@modules/common/common.entity';
import District from '@modules/district/district.entity';
import { RentalType } from '@modules/rental/rental.entity';
import { User } from '@modules/user/user.entity';

export enum TenantType {
	MALE,
	FEMALE,
	COUPLE
}

export enum TenantOccupation {
	PROFESSIONAL,
	STUDENT
}

@Entity()
export class Tenant extends CommonEntity {
	@OneToOne(() => User)
	user: User;

	@Enum()
	type?: TenantType;

	@Enum()
	rental?: RentalType;

	@Enum()
	occupation?: TenantOccupation;

	@Property()
	bio?: string;

	@Property()
	budget?: number;

	@Property()
	imageUrl?: string;

	@ManyToMany()
	districts = new Collection<District>(this);

	constructor(user: User) {
		super();
		this.user = user;
	}
}