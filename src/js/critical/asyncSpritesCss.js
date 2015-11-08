// load sprites.css asynchronously

function loadCssAsync(filename) {
  var ss = document.createElement('link');
  ss.rel = 'stylesheet';
  ss.href = filename;
  // temporary non-applicable media query to load it async
  ss.media = 'only foo';
  document.body.appendChild(ss);
  // set media back
  setTimeout(function () {
    ss.media = 'all';
  });
}

loadCssAsync('css/sprites.css');