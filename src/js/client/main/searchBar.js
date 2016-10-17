import worker from './../shared/worker';
import debounce from 'debounce';
import progress from './progress';
import $ from './jqueryLite';

document.addEventListener('DOMContentLoaded', () => {

  var searchBar = $('#monsters-search-bar');

  searchBar.addEventListener('input', () => {
    progress.start();
  });
  searchBar.addEventListener('input', debounce(e => {
    var filter = e.target.value;

    console.log('posting message to filter', filter);
    console.time('worker');
    worker.postMessage({
      filter: filter,
      type: 'filter'
    });
  }, 50));

});

export default {};