Pokedex.org ![project unmaintained](https://img.shields.io/badge/project-unmaintained-red.svg)
====

An index of Pokémon, built as a client-side JavaScript webapp. Powered by ServiceWorker, PouchDB, [virtual-dom](https://github.com/Matt-Esch/virtual-dom), and web workers.

See the [Introducing Pokedex.org](http://www.pocketjavascript.com/blog/2015/11/23/introducing-pokedex-org) blog post for details on the architecture.

Developing
----

First, be sure to install dependencies:

    npm install


Then start a dev server on localhost:9000:

    npm run serve

To disable ServiceWorker:

    NODE_ENV=testing npm run serve

Building
---

    npm run build
    
This will write files to `www/`.

Bumping the ServiceWorker version
----

The ServiceWorker version is tied to the `package.json` version. So you can bump it by simply doing:

    npm version patch

Building up the database via PokéAPI
-----

_**Note:** you don't need to build up the database to start developing; these are just steps to generate the database files (src/assets/*.txt) from scratch._

This site uses data provided by [PokéAPI](http://pokeapi.co/). To build up the database, you'll need to run:

```
./node_modules/.bin/babel-node bin/build-monsters-database.js
./node_modules/.bin/babel-node bin/build-descriptions-database.js
./node_modules/.bin/babel-node ... # there are several of these
```

Some of the build scripts pull from `src/js/shared/data` (which contains some files that I had to build myself by scraping Bulbapedia), whereas the main ones pull from the live PokeAPI. (I never got the local PokeAPI working correctly, so I just pulled from the remote.)

Debugging
----

You can add `?highPerfAnims=1` to the URL to force high-performance animations to run. (Normally they are disabled for Firefox and Android <5.)

Credits
---


Thanks to [PokeAPI](http://pokeapi.co/) and [Bulbapedia](http://bulbapedia.bulbagarden.net/) for the Pokémon data, and of course to Nintendo, Game Freak, and The Pokémon Company for making such an awesome series of games.
