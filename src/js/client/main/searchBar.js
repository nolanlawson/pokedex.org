var worker = require('./../shared/worker');
var debounce = require('debounce');
var progress = require('./progress');
var $ = require('./jqueryLite');
var marky = require('marky');

document.addEventListener('DOMContentLoaded', () => {

  var searchBar = $('#monsters-search-bar');

  searchBar.addEventListener('input', () => {
    progress.start();
  });
  searchBar.addEventListener('input', debounce(e => {
    var filter = e.target.value;

    console.log('posting message to filter', filter);
    marky.mark('worker');
    worker.postMessage({
      filter: filter,
      type: 'filter'
    });
  }, 50));

});