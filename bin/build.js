var browserify = require('browserify');
var bluebird = require('bluebird');
var fs = bluebird.promisifyAll(require('fs'));
var mkdirp = bluebird.promisify(require('mkdirp'));
var rimraf = bluebird.promisify(require('rimraf'));
var ncp = bluebird.promisify(require('ncp').ncp);
var stream2promise = require('stream-to-promise');
var uglify = require('uglify-js');
var CleanCss = require('clean-css');
var cleanCss = new CleanCss();
var execall = require('execall');

var renderMonsterDetailView = require('../src/js/shared/renderMonsterDetailView');
var renderMonstersList = require('../src/js/shared/renderMonstersList');
var monsterSummaries = require('../src/js/shared/monsterSummaries');
var bulbasaur = require('../src/js/shared/bulbasaur');
var toHtml = require('vdom-to-html');

var CRITICAL_CSS_SPRITES_LINES = 20;

module.exports = async function build(debug) {

  async function inlineSvgs(criticalCss) {
    var svgRegex = /url\((.*?\.svg)\)/g;
    var svgs = execall(svgRegex, criticalCss);
    for (var i = svgs.length - 1; i >= 0; i--) {
      // iterate backwards so we can replace in the string
      var svg = svgs[i];
      var svgFilename = __dirname + '/../src/css/' + svg.sub[0];
      var svgBody = await fs.readFileAsync(svgFilename, 'utf-8');
      var svgBase64 = new Buffer(svgBody, 'utf-8').toString('base64');
      criticalCss = criticalCss.substring(0, svg.index) +
        `url("data:image/svg+xml;base64,${svgBase64}")` +
        criticalCss.substring(svg.index + svg.match.length);
    }
    return cleanCss.minify(criticalCss).styles;
  }

  async function inlineCriticalCss(html) {
    var mainCss = await fs.readFileAsync('./src/css/style.css', 'utf-8');
    var spritesCss = await fs.readFileAsync('./src/css/sprites.css', 'utf-8');

    mainCss += '\n' +
      spritesCss.split('\n').slice(0, CRITICAL_CSS_SPRITES_LINES).join('\n');

    mainCss = await inlineSvgs(mainCss);
    var muiCss = await fs.readFileAsync('./src/vendor/mui.min.css', 'utf-8');

    return html
      .replace(
        '<link href="vendor/mui.min.css" rel="stylesheet"/>',
        `<style>${muiCss}</style>`)
      .replace(
        '<link href="css/style.css" rel="stylesheet"/>',
        `<style>${mainCss}</style>`);
  }

  async function inlineVendorJs(html) {
    var muiJs = await fs.readFileAsync('./src/vendor/mui.min.js', 'utf-8');
    return html.replace(
      '<script src="vendor/mui.min.js"></script>',
      `<script>${muiJs}</script>`);
  }

  async function copyHtml() {
    console.log('copyHtml()');
    var html = await fs.readFileAsync('./src/index.html', 'utf-8');
    var monstersList = renderMonstersList(monsterSummaries);
    html = html.replace('<ul id="monsters-list"></ul>',
      toHtml(monstersList));

    var monsterDetailHtml = renderMonsterDetailView(bulbasaur);
    html = html.replace('<div id="detail-view"></div>',
      toHtml(monsterDetailHtml));

    if (!debug) {
      html = await inlineCriticalCss(html);
      html = await inlineVendorJs(html);
    }
    await fs.writeFileAsync('./www/index.html', html, 'utf-8');
  }

  async function copyCss() {
    console.log('copyCss()');
    var spritesCss = await fs.readFileAsync('./src/css/sprites.css', 'utf-8');

    if (!debug) {
      spritesCss = spritesCss.split('\n').slice(CRITICAL_CSS_SPRITES_LINES).join('\n');
      spritesCss = cleanCss.minify(spritesCss).styles;
    }

    await mkdirp('./www/css');
    await fs.writeFileAsync('./www/css/sprites.css', spritesCss, 'utf-8');
    if (debug) {
      var mainCss = await fs.readFileAsync('./src/css/style.css', 'utf-8');
      await fs.writeFileAsync('./www/css/style.css', mainCss, 'utf-8');
    }
  }

  async function copyJs() {
    console.log('copyJs()');
    await mkdirp('./www/js');

    var files = [
      {
        source: __dirname + '/../src/js/client/index.js',
        dest: __dirname + '/../www/js/main.js'
      },
      {
        source: __dirname + '/../src/js/worker/index.js',
        dest: __dirname + '/../www/js/worker.js'
      }
    ];

    await* files.map(function (file) {
      var stream = browserify({
        fullPaths: debug,
        debug: debug
      }).add(file.source).bundle();
      return stream2promise(stream.pipe(fs.createWriteStream(file.dest)));
    });

    if (!debug) {
      await* files.map(function (file) {
        var code = uglify.minify(file.dest, {
          mangle: true,
          compress: true
        }).code;

        return fs.writeFileAsync(file.dest, code, 'utf-8');
      });
    }
  }

  async function copyStatic() {
    console.log('copyStatic()');
    await ncp('./src/img', './www/img');
    if (debug) {
      await ncp('./src/svg', './www/svg');
      await ncp('./src/vendor', './www/vendor');
    }
  }

  console.log('copying from src to www');
  await rimraf('./www');
  await mkdirp('./www');
  await* [copyHtml(), copyCss(), copyJs(), copyStatic()];
  console.log('wrote files to www/');
};