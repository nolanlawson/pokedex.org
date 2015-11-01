var lie = require('lie');

if (typeof Promise === 'undefined') {
  module.exports = lie;
} else {
  module.exports = Promise;
}