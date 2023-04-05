import { MikroORM } from '@mikro-orm/core';

import { User, Car, Seller } from '../entities/index.js';
import { setupDb } from './setup-db.js';

export const initORM = (): Promise<MikroORM> => setupDb().then(() => MikroORM.init({
  entities: [User, Car, Seller],
  dbName: process.env.DATABASE_NAME,
  type: 'postgresql',
  clientUrl: process.env.DATABASE_URL,
  debug: true,
  allowGlobalContext: true,
}));