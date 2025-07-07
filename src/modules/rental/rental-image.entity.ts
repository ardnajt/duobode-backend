import { Entity, ManyToOne, Property } from '@mikro-orm/sqlite';
import { CommonEntity } from '@modules/common/common.entity';
import Rental from './rental.entity';

@Entity()
export default class RentalImage extends CommonEntity {
	@ManyToOne(() => Rental)
	rental: Rental;

	@Property()
	priority: number;

	@Property()
	imageUrl: string;

	constructor(rental: Rental, priority: number, imageUrl: string) {
		super();
		this.rental = rental;
		this.priority = priority;
		this.imageUrl = imageUrl;
	}
}