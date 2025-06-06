import { Entity, Property } from '@mikro-orm/sqlite';
import { CommonEntity } from '@modules/common/common.entity';

@Entity()
export class Region extends CommonEntity {
	@Property({ unique: true })
	name: string;

	constructor(name: string) {
		super();
		this.name = name;
	}
}