// simple key-value store using localforage

// simple key-value store using localforage

var localForage = require('localforage');

var keyValueStore = {
  get: key => localForage.getItem(key),
  set: (key, val) => localForage.setItem(key, val),
  delete: key => localForage.removeItem(key)
};

export default keyValueStore;