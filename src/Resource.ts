/* eslint-disable no-param-reassign */
import { BaseResource, Filter, BaseRecord, ValidationError, flat } from 'adminjs';
import {
  AnyEntity,
  MikroORM,
  EntityMetadata,
  MetadataStorage,
  EntityManager,
  Loaded,
  wrap,
} from '@mikro-orm/core';
import { EntityClass } from '@mikro-orm/core/typings';

import { Property } from './Property';
import { convertFilter } from './utils/convert-filter';

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

  constructor(args: { model: EntityClass<AnyEntity>, orm: MikroORM }) {
    super(args);

    const { model, orm } = args;
    this.orm = orm;
    this.model = model;
    this.metadata = this.orm.getMetadata().find(model.name);
    this.propertiesObject = this.prepareProperties();
  }

  public databaseName(): string {
    const {
      database,
    } = this.orm.config.getDriver().getConnection().getConnectionOptions();
    return database || 'mikroorm';
  }

  public databaseType(): string {
    return this.orm.config.getAll().type || this.databaseName();
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
    return this.orm.em.getRepository(this.model).count(
      convertFilter(filter),
    );
  }

  public async find(filter: Filter, params: Record<string, any> = {}): Promise<Array<BaseRecord>> {
    const { limit = 10, offset = 0, sort = {} } = params;
    const { direction, sortBy } = sort as { direction: 'asc' | 'desc', sortBy: string };

    const results = await this.orm.em
      .getRepository(this.model)
      .find(
        convertFilter(filter), {
          orderBy: {
            [sortBy]: direction,
          },
          limit,
          offset,
        },
      );

    return results.map((result) => new BaseRecord(wrap(result).toJSON(), this));
  }

  public async findOne(id: string | number): Promise<BaseRecord | null> {
    const result = await this.orm.em
      .getRepository(this.model)
      .findOne(id as any); // mikroorm has incorrect types for `findOne`

    if (!result) return null;

    return new BaseRecord(wrap(result).toJSON(), this);
  }

  public async findMany(
    ids: Array<string | number>,
  ): Promise<Array<BaseRecord>> {
    const pk = this.metadata?.primaryKeys[0];
    if (!pk) return [];

    const results = await this.orm.em
      .getRepository(this.model)
      .find({ [pk]: { $in: ids } });

    return results.map((result) => new BaseRecord(wrap(result).toJSON(), this));
  }

  public async create(params: Record<string, any>): Promise<Record<string, any>> {
    const instance = this.orm.em
      .getRepository(this.model)
      .create(flat.unflatten(params));

    await this.validateAndSave(instance);

    const returnedParams: Record<string, any> = flat.flatten(wrap(instance).toJSON());

    return returnedParams;
  }

  public async update(pk: string | number, params: Record<string, any> = {}): Promise<Record<string, any>> {
    const instance = await this.orm.em
      .getRepository(this.model)
      .findOne(pk as any); // mikroorm has incorrect types for findOneOrFail

    if (!instance) throw new Error('Record to update not found');

    const updatedInstance = wrap(instance).assign(flat.unflatten(params));

    await this.validateAndSave(updatedInstance);

    const returnedParams: Record<string, any> = flat.flatten(wrap(updatedInstance).toJSON());

    return returnedParams;
  }

  public async delete(id: string | number): Promise<void> {
    await this.orm.em
      .getRepository(this.model)
      .nativeDelete(id as any); // mikroorm has incorrect types for nativeDelete
  }

  public static isAdapterFor(args?: { model?: EntityClass<AnyEntity>, orm?: MikroORM }): boolean {
    const { model, orm } = args ?? {};

    return !!model?.name && !!orm?.getMetadata?.().find?.(model.name);
  }

  async validateAndSave(instance: Loaded<AnyEntity>): Promise<void> {
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
      await this.orm.em.persistAndFlush(instance);
    } catch (error) {
      if (error.name === 'QueryFailedError') {
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
      if (!['scalar', 'm:1', '1:1'].includes(prop.reference)) return memo;

      const property = new Property(prop, index);
      memo[property.path()] = property;

      return memo;
    }, {});
  }
}
