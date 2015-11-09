var through = require('through');

var renderMonsterDetailView = require('../src/js/shared/renderMonsterDetailView');
var renderMonstersList = require('../src/js/shared/renderMonstersList');
var toJson = require('vdom-as-json/toJson');
var startingPageSize = require('../src/js/shared/util/constants').pageSize;

//
// Pre-render some of the static data (bulbasaur, first 30 monsters) as VDOM
// so that it doesn't need to be done client-side.
//

function vdomifyFile(renderFun) {
  var fileContents = '';
  return through(function write(data) {
    fileContents += data;
  }, function end() {
    this.queue(JSON.stringify(toJson(renderFun(JSON.parse(fileContents)))));
    this.queue(null);
  });
}

function vdomify(fileName) {
  if (fileName.match(/\/prerendered\/bulbasaur.json$/)) {
    return vdomifyFile(bulbasaur => renderMonsterDetailView(bulbasaur));
  } else if (fileName.match(/\/prerendered\/monsterSummaries.json$/)) {
    return vdomifyFile(monstersList => renderMonstersList(monstersList, startingPageSize));
  }

  return through();
}

module.exports = vdomify;