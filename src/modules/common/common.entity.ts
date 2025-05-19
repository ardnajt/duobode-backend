import { OptionalProps, PrimaryKey, Property } from '@mikro-orm/sqlite';

/**
 * CommonEntity is a base class for all entities in the application.
 * It has predetermined properties such as `id`, `createdTimestamp`, and `updatedTimestamp`.
 * 
 * You may state optional properties when extending this class by passing a string literal type.
 * 
 * @example
 * class User extends CommonEntity<'bio'> {
 *  name: string;
 *  password: string;
 *  bio?: string;
 * }
 */
export abstract class CommonEntity<Optional = never> {
	[OptionalProps]?: 'createdAt' | 'updatedAt' | Optional;

	@PrimaryKey()
	id!: number;

	@Property()
	createdTimestamp = new Date().getTime();

	@Property({ onUpdate: () => new Date().getTime() })
	updatedTimestamp = new Date().getTime();
}