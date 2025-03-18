import { Filter } from 'adminjs';
import { FilterQuery, AnyEntity } from '@mikro-orm/core';

import { Property } from '../Property.js';

function safeParseJSON(json: string) {
  try {
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

const OPERATOR_SEPARATOR = '~';

const MATCHING_PATTERNS = {
  EQ: 'equals',
  NE: 'notEquals',
  CO: 'contains',
  EW: 'endsWith',
  SW: 'startsWith',
};

const OPERATORS = {
  AND: 'and',
  OR: 'or',
};

export function convertFilter(filter?: Filter): FilterQuery<AnyEntity> {
  if (!filter) return {};

  const { filters = {} } = filter;
  return Object.entries(filters).reduce((where, [name, filter]) => {
    if (['boolean', 'number', 'float', 'object', 'array'].includes(filter.property.type())) {
      where[name] = safeParseJSON(filter.value as string);
    } else if (['date', 'datetime'].includes(filter.property.type())) {
      if (typeof filter.value !== 'string' && filter.value.from && filter.value.to) {
        where[name] = { $gte: new Date(filter.value.from), $lte: new Date(filter.value.to) };
      } else if (typeof filter.value !== 'string' && filter.value.from) {
        where[name] = { $gte: new Date(filter.value.from) };
      } else if (typeof filter.value !== 'string' && filter.value.to) {
        where[name] = { $lte: new Date(filter.value.to) };
      }
    } else if ((filter.property as Property).isEnum() || filter.property.type() === 'reference') {
      where[name] = filter.value;
    } else {
      const value = filter.value;
      if (typeof value === 'object') {
        if (value[MATCHING_PATTERNS.SW]) {
          where[name] = { $like: `${value[MATCHING_PATTERNS.SW].toString()}%` };
        } else if (value[MATCHING_PATTERNS.EW]) {
          where[name] = { $like: `%${value[MATCHING_PATTERNS.EW].toString()}` };
        } else if (value[MATCHING_PATTERNS.EQ]) {
          where[name] = value[MATCHING_PATTERNS.EQ];
        } else if (value[MATCHING_PATTERNS.NE]) {
          where[name] = { $ne: `%${value[MATCHING_PATTERNS.NE].toString()}` };
        } else {
          const orPrefix = `${OPERATORS.OR}${OPERATOR_SEPARATOR}`;
          if (value[`${orPrefix}${MATCHING_PATTERNS.SW}`]) {
            return {
              ...where,
              $or: [
                ...(where['$or'] || []),
                {
                  [name]: { $like: `${value[`${orPrefix}${MATCHING_PATTERNS.SW}`].toString()}%` },
                },
              ],
            };
          } else if (value[`${orPrefix}${MATCHING_PATTERNS.EW}`]) {
            return {
              ...where,
              $or: [
                ...(where['$or'] || []),
                {
                  [name]: { $like: `%${value[`${orPrefix}${MATCHING_PATTERNS.EW}`].toString()}` },
                },
              ],
            };
          } else if (value[`${orPrefix}${MATCHING_PATTERNS.EQ}`]) {
            return {
              ...where,
              $or: [
                ...(where['$or'] || []),
                {
                  [name]: value[`${orPrefix}${MATCHING_PATTERNS.EQ}`].toString(),
                },
              ],
            };
          } else if (value[`${orPrefix}${MATCHING_PATTERNS.NE}`]) {
            return {
              ...where,
              $or: [
                ...(where['$or'] || []),
                {
                  [name]: { $ne: value[`${orPrefix}${MATCHING_PATTERNS.NE}`].toString() },
                },
              ],
            };
          } else if (value[OPERATORS.OR]) {
            return {
              ...where,
              $or: [
                ...(where['$or'] || []),
                {
                  [name]: { $like: `%${value[OPERATORS.OR].toString()}%` },
                },
              ],
            };
          }
        }
      } else {
        where[name] = { $like: `%${value.toString()}%` };
      }
    }

    return where;
  }, {});
}
