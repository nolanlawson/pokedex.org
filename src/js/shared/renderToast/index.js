import h from 'virtual-dom/h';

export default options => {
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