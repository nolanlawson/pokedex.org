
var worker = require('./worker');
var debounce = require('debounce');

document.addEventListener('DOMContentLoaded', () => {

  var $ = document.querySelector.bind(document);

  var searchBar = $('#monsters-search-bar');

  searchBar.addEventListener('input', debounce(e => {
    var filter = e.target.value;

    console.log('posting message to filter', filter);
    console.time('worker-filter');
    worker.postMessage({
      filter: filter
    });
  }, 700, false));

});