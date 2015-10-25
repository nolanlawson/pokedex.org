#!/usr/bin/env bash

if [ ! -d pokeapi ]; then
  git clone https://github.com/phalt/pokeapi.git --depth 1 --branch master --single-branch
fi
cd pokeapi
make install
make setup
make serve
