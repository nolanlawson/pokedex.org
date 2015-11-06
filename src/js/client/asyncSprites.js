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
  var ref = document.getElementsByTagName('script')[0];
  ss.rel = 'stylesheet';
  ss.href = filename;
  // temporary non-applicable media query to load it async
  ss.media = 'only foo';
  ref.parentNode.insertBefore(ss, ref);
  // set media back
  setTimeout(function () {
    ss.media = 'all';
  });
}

if (canUseWebP()) {
  loadCssAsync('css/sprites-webp.css');
} else {
  loadCssAsync('css/sprites.css');
}