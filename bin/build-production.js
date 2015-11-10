var build = require('./build');

build(false).catch(err => console.error(err.stack));