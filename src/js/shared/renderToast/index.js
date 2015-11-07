var h = require('virtual-dom/h');

module.exports = options => {
  var {text, buttonText} = options;
  return h('div.toast', [
    h('span', text),
    h('div', [
      h('button.mui-btn.mui-btn--flat.mui-btn--primary', {
        type: 'button'
      }, buttonText)
    ])
  ]);
};