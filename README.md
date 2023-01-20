## adminjs-mikroorm

This is an official [AdminJS](https://github.com/SoftwareBrothers/adminjs) adapter which integrates [MikroORM](https://github.com/mikro-orm/mikro-orm) into AdminJS.

### Installation

yarn
```bash
$ yarn add @adminjs/mikroorm
```

npm
```bash
$ npm i @adminjs/mikroorm
```

## Usage

The plugin can be registered using standard `AdminJS.registerAdapter` method.

```typescript
import { Database, Resource } from '@adminjs/mikroorm';
import AdminJS from 'adminjs';
import { validate } from 'class-validator';

const setupAdminJs = async () => {
  const orm = await MikroORM.init({
    entities: [User],
    dbName: process.env.DATABASE_NAME,
    type: 'postgresql',
    clientUrl: process.env.DATABASE_URL,
  });

  // If your entities use `class-validator` to validate data, you can inject it's validate method into the resource.
  Resource.validate = validate;
  AdminJS.registerAdapter({ Database, Resource });

  // You can instantiate AdminJS either by specifying all resources separately:
  const adminJs = new AdminJS({
    resources: [{ resource: { model: User, orm }, options: {} }],
  });

  // Or by passing your ORM instance into `databases` property.
  const adminJs = new AdminJS({
    databases: [orm],
  });
  // You should choose to use either `resources` or `databases`
};
```

## Example

An example project can be found in `example-app` directory.

## Associations

Currently only `ManyToOne` and `OneToOne` relationships are supported due to current AdminJS's core limitations
for adapter integrations. `OneToMany` and `ManyToMany` relationships can still be achieved through a combination of custom components and hooks.

## Contribution

### Running the example app

If you want to set this up locally this is the suggested process:

1. Fork the repo
2. Install dependencies

```
yarn install
```

3. Register this package as a [linked package](https://classic.yarnpkg.com/en/docs/cli/link/)

```
yarn link
```

4. Setup example app

Install all dependencies and use previously linked version of `@adminjs/mikroorm`.

```
cd example-app
yarn install
yarn link "@adminjs/mikroorm"
```

Optionally you might want to link your local version of `adminjs` package

5. Make sure you have all the envs set (see `./example-app/example.env` and create an `.env` file based on that)

6. Build the package in watch mode

(in the root folder)

```
yarn dev
```

6. Run the app in the dev mode

```
cd example-app
yarn dev
```

### Pull request

Before you make a PR make sure all tests pass and your code wont causes linter errors.
You can do this by running:

```
yarn lint
yarn test
```

Make sure you have an `.env` file in project's root directory for the test runner to use:
```
DATABASE_URL=postgres://postgres:@localhost:5433/mikroorm_test
DATABASE_NAME=mikroorm_test
```
## License

AdminJS is copyrighted © 2023 rst.software. It is a free software, and may be redistributed under the terms specified in the [LICENSE](LICENSE.md) file.

## About rst.software

<img src="https://pbs.twimg.com/profile_images/1367119173604810752/dKVlj1YY_400x400.jpg" width=150>

We’re an open, friendly team that helps clients from all over the world to transform their businesses and create astonishing products.

* We are available for [hire](https://www.rst.software/estimate-your-project).
* If you want to work for us - check out the [career page](https://www.rst.software/join-us).

