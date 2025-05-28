import { MikroORM } from '@mikro-orm/sqlite';
import config from './mikro-orm.config';

let cache: MikroORM;

export async function initORM() {
  if (cache) return cache;
  const orm = await MikroORM.init(config as any);
  return cache = orm;
}