/* eslint-disable no-console */
import 'reflect-metadata';
import { MikroORM } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

import { Car, Seller, User } from '../entities/index.js';

export const setupDb = async () => {
  const orm = await MikroORM.init({
    entities: [User, Car, Seller],
    dbName: process.env.DATABASE_NAME,
    driver: PostgreSqlDriver,
    clientUrl: process.env.DATABASE_URL,
  });
  const generator = orm.getSchemaGenerator();

  await generator.dropSchema();
  await generator.createSchema();
  await generator.updateSchema();

  await orm.close(true);
};
