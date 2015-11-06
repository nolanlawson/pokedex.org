// load sprites.css asynchronously

function canUseWebP() {
  var elem = document.createElement('canvas');

  if (elem.getContext && elem.getContext('2d')) {
    // was able or not to get WebP representation
    return /^data:image\/webp/.test(elem.toDataURL('image/webp'));
  }
  // very old browser like IE 8, canvas not supported
  return false;
}

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

if (canUseWebP()) {
  loadCssAsync('css/sprites-webp1.css');
  loadCssAsync('css/sprites-webp2.css');
  loadCssAsync('css/sprites-webp3.css');
} else {
  loadCssAsync('css/sprites1.css');
  loadCssAsync('css/sprites2.css');
  loadCssAsync('css/sprites3.css');
}