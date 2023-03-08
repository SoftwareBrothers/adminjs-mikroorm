import { BaseDatabase } from 'adminjs';
import { MikroORM } from '@mikro-orm/core';

import { Resource } from './Resource.js';

export class Database extends BaseDatabase {
  public constructor(public readonly orm: MikroORM) {
    super(orm);
    this.orm = orm;
  }

  public resources(): Array<Resource> {
    const metadata = this.orm.getMetadata();
    if (!metadata) return [];
    metadata.decorate(this.orm.em);

    return Object.values(metadata.getAll()).reduce((memo: Resource[], meta) => {
      const resource = new Resource({
        model: meta.class,
        orm: this.orm,
      });
      memo.push(resource);

      return memo;
    }, []);
  }

  public static isAdapterFor(orm: MikroORM): boolean {
    return !!orm.isConnected?.() && !!orm.getMetadata?.();
  }
}
