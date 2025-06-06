import { Entity, ManyToOne, Property } from '@mikro-orm/sqlite';
import { CommonEntity } from '@modules/common/common.entity';
import { Region } from '@modules/region/region.entity';

@Entity()
export class District extends CommonEntity {
	@ManyToOne()
	region: Region;
	
	@Property({ unique: true })
	name: string;

	constructor(region: Region, name: string) {
		super();
		this.region = region;
		this.name = name;
	}
}