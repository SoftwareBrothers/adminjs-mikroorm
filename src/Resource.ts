/* eslint-disable no-param-reassign */
import {
  BaseResource,
  Filter,
  BaseRecord,
  ValidationError,
  flat,
} from 'adminjs';
import {
  AnyEntity,
  MikroORM,
  EntityMetadata,
  MetadataStorage,
  EntityManager,
  Loaded,
  wrap,
  EntityClass,
  ReferenceKind,
} from '@mikro-orm/core';

import { Property } from './Property.js';
import { convertFilter } from './utils/convert-filter.js';

export type AdapterORM = {
  database?: string;
  databaseType?: string;
  entityManager: EntityManager;
  metadata: MetadataStorage;
};

export class Resource extends BaseResource {
  public static validate: any;

  private orm: MikroORM;

  private metadata?: EntityMetadata;

  private model: EntityClass<AnyEntity>;

  private propertiesObject: Record<string, Property>;

  constructor(args: { model: EntityClass<AnyEntity>; orm: MikroORM }) {
    super(args);

    const { model, orm } = args;
    this.orm = orm;
    this.model = model;
    this.metadata = this.orm.getMetadata().find(model.name);
    this.propertiesObject = this.prepareProperties();
  }

  public databaseName(): string {
    const { database } = this.orm.config
      .getDriver()
      .getConnection()
      .getConnectionOptions();
    return database || 'mikroorm';
  }

  public databaseType(): string {
    return this.databaseName();
  }

  public name(): string {
    return this.metadata?.name ?? this.metadata?.className ?? '';
  }

  public id(): string {
    return this.name();
  }

  public properties(): Array<Property> {
    return [...Object.values(this.propertiesObject)];
  }

  public property(path: string): Property {
    return this.propertiesObject[path];
  }

  public build(params: Record<string, any>): BaseRecord {
    return new BaseRecord(flat.unflatten(params), this);
  }

  public async count(filter: Filter): Promise<number> {
    return this.orm.em
      .fork()
      .getRepository(this.model)
      .count(convertFilter(filter));
  }

  public async find(
    filter: Filter,
    params: Record<string, any> = {},
  ): Promise<Array<BaseRecord>> {
    const { limit = 10, offset = 0, sort = {} } = params;
    const { direction, sortBy } = sort as {
      direction: 'asc' | 'desc';
      sortBy: string;
    };

    const results = await this.orm.em
      .fork()
      .getRepository(this.model)
      .find(convertFilter(filter), {
        orderBy: {
          [sortBy]: direction,
        },
        limit,
        offset,
      });

    return results.map(
      (result) => new BaseRecord(wrap(result).toObject(), this),
    );
  }

  public async findOne(id: string | number): Promise<BaseRecord | null> {
    const result = await this.orm.em
      .fork()
      .getRepository(this.model)
      .findOne(id as any); // mikroorm has incorrect types for `findOne`

    if (!result) return null;

    return new BaseRecord(wrap(result).toObject(), this);
  }

  public async findMany(
    ids: Array<string | number>,
  ): Promise<Array<BaseRecord>> {
    const pk = this.metadata?.primaryKeys[0];
    if (!pk) return [];

    const results = await this.orm.em
      .fork()
      .getRepository(this.model)
      .find({ [pk]: { $in: ids } });

    return results.map(
      (result) => new BaseRecord(wrap(result).toObject(), this),
    );
  }

  public async create(
    params: Record<string, any>,
  ): Promise<Record<string, any>> {
    const em = this.orm.em.fork();
    const instance = em
      .getRepository(this.model)
      .create(flat.unflatten(params));

    await this.validateAndSave(instance, em);

    const returnedParams: Record<string, any> = flat.flatten(
      wrap(instance).toObject(),
    );

    return returnedParams;
  }

  public async update(
    pk: string | number,
    params: Record<string, any> = {},
  ): Promise<Record<string, any>> {
    const em = this.orm.em.fork();
    const instance = await em.getRepository(this.model).findOne(pk);

    if (!instance) throw new Error('Record to update not found');

    const updatedInstance = wrap(instance).assign(flat.unflatten(params));

    await this.validateAndSave(updatedInstance, em);

    const returnedParams: Record<string, any> = flat.flatten(
      wrap(updatedInstance).toObject(),
    );

    return returnedParams;
  }

  public async delete(id: string | number): Promise<void> {
    await this.orm.em
      .fork()
      .getRepository(this.model)
      .nativeDelete(id as any); // mikroorm has incorrect types for nativeDelete
  }

  public static isAdapterFor(args?: {
    model?: EntityClass<AnyEntity>;
    orm?: MikroORM;
  }): boolean {
    const { model, orm } = args ?? {};

    return !!model?.name && !!orm?.getMetadata?.().find?.(model.name);
  }

  async validateAndSave(
    instance: Loaded<AnyEntity>,
    em: EntityManager,
  ): Promise<void> {
    if (Resource.validate) {
      const errors = await Resource.validate(instance);
      if (errors && errors.length) {
        const validationErrors = errors.reduce(
          (memo, error) => ({
            ...memo,
            [error.property]: {
              type: Object.keys(error.constraints)[0],
              message: Object.values(error.constraints)[0],
            },
          }),
          {},
        );
        throw new ValidationError(validationErrors);
      }
    }
    try {
      await em.persistAndFlush(instance);
    } catch (error) {
      // TODO: figure out how to get column name from MikroORM's error metadata
      // It currently seems to return only whole Entity
      console.log(error);
      if (
        error.name === 'QueryFailedError'
        || error.name === 'ValidationError'
      ) {
        throw new ValidationError({
          [error.column]: {
            type: 'QueryFailedError',
            message: error.message,
          },
        });
      }
    }
  }

  private prepareProperties(): { [propertyPath: string]: Property } {
    const { hydrateProps = [] } = this.metadata ?? {};
    return hydrateProps.reduce((memo, prop, index) => {
      if (
        ![
          ReferenceKind.SCALAR,
          ReferenceKind.MANY_TO_ONE,
          ReferenceKind.ONE_TO_ONE,
          ReferenceKind.MANY_TO_MANY,
        ].includes(prop.kind)
      ) return memo;

      const property = new Property(prop, index);
      memo[property.path()] = property;

      return memo;
    }, {});
  }
}
