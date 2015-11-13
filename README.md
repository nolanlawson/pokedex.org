Pokedex.org
====

An index of Pokémon, built as a client-side JavaScript webapp. Powered by ServiceWorker, PouchDB, [virtual-dom](https://github.com/Matt-Esch/virtual-dom), and web workers.

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
