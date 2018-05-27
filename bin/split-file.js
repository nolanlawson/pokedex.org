#!/usr/bin/env node

// used to split up the src/assets/*.txt files into smaller chunks

require('regenerator-runtime/runtime');
var bluebird = require('bluebird');
var fs = bluebird.promisifyAll(require('fs'));

async function splitFile(inputFilename, targetFilename, numLines) {
  var file = await fs.readFileAsync(inputFilename, 'utf-8');
  file = file.split('\n');

  var files = [];

  var currentLines = 0;
  var currentFile = '';
  for (let i = 0; i < file.length; i++) {
    var line = file[i];
    currentLines++;
    currentFile += line + '\n';
    if (currentLines > numLines && line && JSON.parse(line).seq) {
      files.push(currentFile);
      currentFile = '';
      currentLines = 0;
    }
  }

  if (currentFile) {
    files.push(currentFile);
  }

  for (let i = 0; i < files.length; i++) {
    var splitFilename = targetFilename.replace('.txt', `-${i + 1}.txt`);
    await fs.writeFileAsync(splitFilename, files[i], 'utf-8');
  }
}

module.exports = splitFile;
