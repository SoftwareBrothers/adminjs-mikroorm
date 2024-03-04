## Local setup

Prepare database service:
```bash
$ docker-compose up -d
$ cp example.env .env
```

Default env vars should work if you used docker-compose to setup Postgres.

Build app, setup database schema, run app:

```bash
$ yarn
$ yarn build
$ yarn db:setup
$ yarn start
```

Optionally: you can link local `@adminjs/mikroorm` if you plan to make changes.

```bash
$ cd ..                                 # return to root directory
$ yarn link                             # create a link to local package
$ yarn clean && yarn build              # clean workdir and build local package
$ cd example-app                        # return to example app
$ yarn link "@adminjs/mikroorm"
```
You should now see your local changes in `@adminjs/mikroorm`. Make sure to re-run the example app whenever you make changes, or setup nodemon.
