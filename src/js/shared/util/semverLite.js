// semver is apparently pretty large (4.7kB min+gz, so just write our own)

module.exports = {
  parse: function (str) {
    var split = str.split('.').map(x => parseInt(x, 10));
    return {
      major: split[0],
      minor: split[1],
      patch: split[2]
    };
  }
};