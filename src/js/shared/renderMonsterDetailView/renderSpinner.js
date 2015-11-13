var h = require('virtual-dom/h');

module.exports = () => {
  return h('div.big-spinner-holder', [
    h("svg.spinner.big-spinner", {
      "attributes": {
        "width": "65px",
        "height": "65px",
        "viewbox": "0 0 66 66",
        "xmlns": "http://www.w3.org/2000/svg"
      }, "namespace": "http://www.w3.org/2000/svg"
    }, [h("circle.spinner-path", {
      "attributes": {
        "fill": "none",
        "stroke-width": "6",
        "stroke-linecap": "round",
        "cx": "33",
        "cy": "33",
        "r": "30"
      }, "namespace": "http://www.w3.org/2000/svg"
    })])
  ]);
};