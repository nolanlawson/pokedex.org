// same as debounce, but also calls the function during
// intervals equal to the "wait" in milliseconds
module.exports = (func, wait) => {
  var timeout;
  var lastTime;
  return () => {
    var currentTime = Date.now();
    if (!lastTime) {
      lastTime = currentTime;
    }
    var later = () => {
      timeout = null;
      func();
    };
    if (currentTime - lastTime >= wait) {
      console.log('currentTime', currentTime, 'lastTime', lastTime);
      func();
      lastTime = currentTime;
    }
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};