/**
 * @module @adminjs/mikroorm
 * @subcategory Adapters
 * @section modules
 *
 * @description
 * ### Official [AdminJS](https://github.com/SoftwareBrothers/adminjs) adapter which integrates
 * [MikroORM](https://github.com/mikro-orm/mikro-orm) into AdminJS.
 *
 * #### Installation
 *
 * ```bash
 * $ yarn add @adminjs/mikroorm
 * ```
 * or
 * ```bash
 * $ npm i @adminjs/mikroorm
 * ```
 *
 * ## Usage
 *
 * The plugin can be registered using standard `AdminJS.registerAdapter` method.
 *
 * ```typescript
 * import { Database, Resource } from '@adminjs/mikroorm';
 * import AdminJS from 'adminjs';
 * import { validate } from 'class-validator';
 *
 * const setupAdminJs = async () => {
 *   const orm = await MikroORM.init({
 *     entities: [User],
 *     dbName: process.env.DATABASE_NAME,
 *     type: 'postgresql',
 *     clientUrl: process.env.DATABASE_URL,
 *   });
 *
 *   // If your entities use `class-validator` to validate data, you can inject it's validate method into the resource.
 *   Resource.validate = validate;
 *   AdminJS.registerAdapter({ Database, Resource });
 *
 *   // You can instantiate AdminJS either by specifying all resources separately:
 *   const adminJs = new AdminJS({
 *     resources: [{ resource: { model: User, orm }, options: {} }],
 *   });
 *
 *   // Or by passing your ORM instance into `databases` property.
 *   const adminJs = new AdminJS({
 *     databases: [orm],
 *   });
 *   // You should choose to use either `resources` or `databases`
 * };
 * ```
 *
 * ## Associations
 *
 * Currently only `ManyToOne` and `OneToOne` relationships are supported due to current AdminJS's core limitations
 * for adapter integrations. `OneToMany` and `ManyToMany` relationships can still be achieved through
 * a combination of custom components and hooks.
 *
 */

/**
 * Implementation of {@link BaseDatabase} for MikroORM Adapter
 *
 * @memberof module:@adminjs/mikroorm
 * @type {typeof BaseDatabase}
 * @static
 */
import { Database } from './Database';

/**
 * Implementation of {@link BaseResource} for MikroORM Adapter
 *
 * @memberof module:@adminjs/mikroorm
 * @type {typeof BaseResource}
 * @static
 */
import { Resource } from './Resource';

export { Resource } from './Resource';
export { Database } from './Database';

export default { Database, Resource };
