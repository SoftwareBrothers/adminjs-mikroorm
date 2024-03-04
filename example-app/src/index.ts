import 'reflect-metadata';

/* eslint-disable import/first */
import express from 'express';
import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import { Database, Resource } from '@adminjs/mikroorm';
import { MikroORM } from '@mikro-orm/core';

import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { User, Car, Seller } from './entities/index.js';
/* eslint-enable import/first */

const PORT = 3000;

const run = async () => {
  const orm = await MikroORM.init({
    entities: [User, Car, Seller],
    dbName: process.env.DATABASE_NAME,
    driver: PostgreSqlDriver,
    clientUrl: process.env.DATABASE_URL,
    debug: true,
  });

  AdminJS.registerAdapter({ Database, Resource });

  const app = express();

  const resources = [
    {
      resource: { model: User, orm },
      options: {
        properties: {
          firstName: {
            isTitle: true,
          },
        },
      },
    },
    {
      resource: { model: Car, orm },
      options: {
        properties: {
          meta: { type: 'mixed' },
          'meta.title': {
            type: 'string',
          },
          'meta.description': {
            type: 'string',
          },
        },
      },
    },
    { model: Seller, orm },
  ];

  const admin = new AdminJS({
    // databases: [orm],
    resources,
  });

  const router = AdminJSExpress.buildRouter(admin);

  app.use(admin.options.rootPath, router);

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Example app listening at http://localhost:${PORT}`);
  });
};

run();
