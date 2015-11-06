// Keep an in-memory list of monster summaries, so that the
// main summary list is not slowed down by PouchDB.
// Also keep a binary search index of names for prefix search.

var monsterSummaries = require('../shared/data/monsterSummaries');

var byName = monsterSummaries.map(function (monster) {
  return {
    key: monster.name.toLowerCase(),
    value: monster
  };
}).sort(function (a, b) {
  return a.key < b.key ? -1 : 1;
});

function binarySearch(arr, target) {
  var low = 0, high = arr.length, mid;
  while (low < high) {
    mid = (low + high) >>> 1; // faster version of Math.floor((low + high) / 2)
    arr[mid].key < target ? low = mid + 1 : high = mid;
  }
  return low;
}

module.exports = {
  findAll: () => {
    return monsterSummaries;
  },
  findByNationalId: nationalId => monsterSummaries[nationalId - 1],
  findByNamePrefix: prefix => {
    prefix = prefix.toLowerCase();
    var idx = binarySearch(byName, prefix);
    if (!byName[idx]) {
      return [];
    }
    var res = [];
    for (var i = idx; i < byName.length; i++) {
      var target = byName[i];
      if (target.key >= prefix && target.key < prefix + '\ufff0') {
        res.push(target.value);
      } else {
        break;
      }
    }
    return res;
  }
};