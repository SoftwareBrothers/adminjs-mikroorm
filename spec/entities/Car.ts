/* eslint-disable no-use-before-define */
import { BaseEntity, Entity, ManyToOne, PrimaryKey, Property, Enum } from '@mikro-orm/core';
import { MinLength } from 'class-validator';

import type { Seller } from './Seller.js';
import type { User } from './User.js';

export enum CarType {
  MODERN = 'modern',
  OLD = 'old'
}

@Entity({ tableName: 'cars' })
export class Car extends BaseEntity {
  @PrimaryKey()
    id: number;

  @Property({ fieldName: 'name', columnType: 'text' })
  @MinLength(10)
    name: string;

  @Property({ fieldName: 'meta', columnType: 'jsonb', default: '{}' })
    meta: Record<string, any>;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
    createdAt: Date = new Date();

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz', onUpdate: () => new Date() })
    updatedAt: Date = new Date();

  @Enum(() => CarType)
    type: CarType;

  @ManyToOne(() => 'User', { mapToPk: true, nullable: true })
    owner: User | null;

  @ManyToOne(() => 'Seller', { mapToPk: true, nullable: true })
    seller: Seller | null;
}
