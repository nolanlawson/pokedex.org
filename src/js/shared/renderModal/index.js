var h = require('virtual-dom/h');

module.exports = options => {
  var {title, text, buttonText} = options;
  return h('div.pokedex-modal', [
    h('div.pokedex-modal-inner.mui-panel', [
      h('h2.pokedex-modal-title', title),
      h('div.pokedex-modal-content', text),
      h('button.mui-btn.mui-btn--flat.mui-btn--primary', buttonText)
    ])
  ]);
};