Pokedex.org
====

An index of Pokémon, built as a client-side JavaScript webapp. Powered by ServiceWorker, PouchDB, [virtual-dom](https://github.com/Matt-Esch/virtual-dom), and web workers.

Building up the database via PokéAPI
-----

This site uses data provided by [PokéAPI](http://pokeapi.co/). To build up the database, you'll need to run:

```
./node_modules/.bin/babel-node bin/build-monsters-database.js
./node_modules/.bin/babel-node bin/build-descriptions-database.js
./node_modules/.bin/babel-node ... # there are several of these
```

Developing
----

Start a dev server on localhost:9000:

    npm run serve

To disable ServiceWorker:

    NODE_ENV=testing npm run serve

Building
---

    npm run build
    
This will write files to `www/`.
