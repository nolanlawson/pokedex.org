var result = false;

var elem = document.createElement('canvas');

if (elem.getContext && elem.getContext('2d')) {
  // was able or not to get WebP representation
  result = /^data:image\/webp/.test(elem.toDataURL('image/webp'));
}

module.exports = () => {
  return result;
};