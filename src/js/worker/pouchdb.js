// custom version of pouchdb cutting out stuff we don't need

import PouchDB from 'pouchdb-core';
import idb from 'pouchdb-adapter-idb';
import websql from 'pouchdb-adapter-websql';
import http from 'pouchdb-adapter-http';
import upsert from 'pouchdb-upsert';
import load from 'pouchdb-load';

export default PouchDB
  .plugin(idb)
  .plugin(websql)
  .plugin(http)
  .plugin(upsert)
  .plugin(load);