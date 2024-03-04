/* eslint-disable no-console */
import 'reflect-metadata';

/* eslint-disable import/first */
import { MikroORM } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Car, Seller, User } from '../entities/index.js';
/* eslint-enable import/first */

(async () => {
  const orm = await MikroORM.init({
    entities: [User, Car, Seller],
    dbName: process.env.DATABASE_NAME,
    driver: PostgreSqlDriver,
    clientUrl: process.env.DATABASE_URL,
  });
  const generator = orm.getSchemaGenerator();

  // or you can run those queries directly, but be sure to check them first!
  await generator.dropSchema();
  await generator.createSchema();
  await generator.updateSchema();

  await orm.close(true);
})();
