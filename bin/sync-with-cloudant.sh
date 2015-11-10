#!/usr/bin/env bash

if [[ -z $USER || -z $PASSWORD ]]; then
  echo "please provide a USER and PASSWORD"
  exit 1
fi

sync=./node_modules/.bin/pouch-replicate
couch="https://${USER}:${PASSWORD}@nolan.cloudant.com"

for db in descriptions evolutions monster-moves monsters monsters-supplemental moves; do
  curl -X DELETE "${couch}/${db}"
  pouch-replicate "db/${db}" "${couch}/${db}"
done

