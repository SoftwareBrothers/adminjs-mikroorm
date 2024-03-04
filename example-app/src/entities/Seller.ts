/* eslint-disable no-use-before-define */
import { BaseEntity, Entity, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';

import type { Car } from './Car.js';

export enum UserRoles {
  DESIGNER = 'designer',
  CLIENT = 'client',
}

@Entity()
export class Seller extends BaseEntity {
  @PrimaryKey({ columnType: 'uuid' })
    id = v4();

  @Property({ fieldName: 'name', columnType: 'text' })
    name: string;

  @OneToMany(() => 'Car', (car: Car) => car.seller)
    cars: Car[];
}
