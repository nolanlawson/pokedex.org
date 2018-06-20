const csvParse = require('csv-parse');
const fs = require('fs');

module.exports.object = async function loadCSVObject(filepath, uniqueKey, filter) {
  const parser = csvParse({columns: true});
  const result = {};
  parser.on('readable', function() {
    while (record = parser.read()) {
      if (!filter || filter(record)) {
        result[record[uniqueKey]] = record;
      }
    }
  });

  fs.createReadStream(filepath).pipe(parser);
  return new Promise(function(resolve, reject) {
    parser.on('end', ()=>resolve(result));
    parser.on('error', reject);
  });
};

module.exports.array = async function loadCSVArray(filepath, filter) {
  const parser = csvParse({columns: true});
  const result = [];
  parser.on('readable', function() {
    while (record = parser.read()) {
      if (!filter || filter(record)) {
        result.push(record);
      }
    }
  });

  fs.createReadStream(filepath).pipe(parser);
  return new Promise(function(resolve, reject) {
    parser.on('end', ()=>resolve(result));
    parser.on('error', reject);
  });
};
