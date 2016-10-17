var $ = require('./jqueryLite');

var themeMeta;
var appTheme;
var headerAppBar;

function setThemeColor(color) {
  themeMeta.content = color;
  // this peeks out on android, looks less weird with the right color
  headerAppBar.style.backgroundColor = color;
}

function resetThemeColor() {
  themeMeta.content = appTheme;
  headerAppBar.style.backgroundColor = appTheme;
}

document.addEventListener('DOMContentLoaded', () => {
  themeMeta = document.head.querySelector('meta[name="theme-color"]');
  appTheme = themeMeta.content;
  headerAppBar = $('.mui-appbar');
});

module.exports = {
  setThemeColor,
  resetThemeColor
};