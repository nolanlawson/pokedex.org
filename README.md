pokedex
====

work in progress

Building up the database via PokéAPI
-----

```
./node_modules/.bin/babel-node bin/build-monsters-database.js
./node_modules/.bin/babel-node bin/build-descriptions-database.js
```

Developing
----

Start a dev server on localhost:9000:

    npm run serve

To disable service worker:

    NODE_ENV=testing npm run serve

Building
---

    npm run build
