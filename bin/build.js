var browserify = require('browserify');
var bluebird = require('bluebird');
var fs = bluebird.promisifyAll(require('fs'));
var mkdirp = bluebird.promisify(require('mkdirp'));
var rimraf = bluebird.promisify(require('rimraf'));
var ncp = bluebird.promisify(require('ncp').ncp);
var cp = bluebird.promisify(require('cp'));
var stream2promise = require('stream-to-promise');
var uglify = require('uglify-js');
var CleanCss = require('clean-css');
var cleanCss = new CleanCss();
var execall = require('execall');
var minifyHtml = require('html-minifier').minify;
var bundleCollapser = require("bundle-collapser/plugin");
var envify = require('envify/custom');

var renderMonsterDetailView = require('../src/js/shared/renderMonsterDetailView');
var renderMonstersList = require('../src/js/shared/renderMonstersList');
var monsterSummaries = require('../src/js/shared/data/monsterSummaries');
var bulbasaur = require('../src/js/shared/data/bulbasaur');
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
    return criticalCss;
  }

  async function inlineCriticalJs(html) {
    await browserifyFile({
      source: __dirname + '/../src/js/critical/index.js',
      dest: __dirname + '/../www/js/critical.js'
    });
    var critJs = await fs.readFileAsync(__dirname + '/../www/js/critical.js');
    return html.replace(
      '<script src="js/critical.js"></script>',
      `<script>${critJs}</script>`);
  }

  async function inlineCriticalCss(html) {
    var mainCss = await fs.readFileAsync('./src/css/style.css', 'utf-8');
    var spritesCss = await fs.readFileAsync('./src/css/sprites1.css', 'utf-8');

    mainCss += '\n' +
      spritesCss.split('\n').slice(0, CRITICAL_CSS_SPRITES_LINES).join('\n');

    mainCss = await inlineSvgs(mainCss);
    mainCss = cleanCss.minify(mainCss).styles;
    var muiCss = await fs.readFileAsync('./src/vendor/mui.css', 'utf-8');
    muiCss = cleanCss.minify(muiCss).styles;
    return html
      .replace(
        '<link href="vendor/mui.css" rel="stylesheet"/>',
        `<style>${muiCss}</style>`)
      .replace(
        '<link href="css/style.css" rel="stylesheet"/>',
        `<style>${mainCss}</style>`);
  }

  async function inlineVendorJs(html) {
    var muiMin = uglify.minify('./src/vendor/mui.js', {
      mangle: true,
      compress: true
    }).code;
    return html.replace(
      '<script src="vendor/mui.js"></script>',
      `<script>${muiMin}</script>`);
  }

  async function buildHtml() {
    console.log('buildHtml()');
    var html = await fs.readFileAsync('./src/index.html', 'utf-8');
    var monstersList = renderMonstersList(monsterSummaries);
    html = html.replace('<ul id="monsters-list"></ul>',
      toHtml(monstersList));

    var monsterDetailHtml = renderMonsterDetailView(bulbasaur);
    html = html.replace('<div id="detail-view"></div>',
      toHtml(monsterDetailHtml));

    if (!debug) {
      html = await inlineCriticalCss(html);
      html = await inlineCriticalJs(html);
      html = await inlineVendorJs(html);
      html = minifyHtml(html, {removeAttributeQuotes: true});
    }
    await fs.writeFileAsync('./www/index.html', html, 'utf-8');
  }

  async function getCss(filename) {
    var css = await fs.readFileAsync(filename, 'utf-8');
    if (debug) {
      return cleanCss.minify(css).styles;
    }
    return css;
  }

  async function buildCss() {
    console.log('buildCss()');
    var spritesCss = await fs.readFileAsync('./src/css/sprites1.css', 'utf-8');
    var spritesWebpCss = await fs.readFileAsync('./src/css/sprites-webp1.css', 'utf-8');

    if (!debug) {
      spritesCss = spritesCss.split('\n').slice(CRITICAL_CSS_SPRITES_LINES).join('\n');
      spritesCss = cleanCss.minify(spritesCss).styles;

      spritesWebpCss = spritesWebpCss.split('\n').slice(CRITICAL_CSS_SPRITES_LINES).join('\n');
      spritesWebpCss = cleanCss.minify(spritesWebpCss).styles;
    }

    await mkdirp('./www/css');
    var promises = [
      fs.writeFileAsync('./www/css/sprites1.css', spritesCss, 'utf-8'),
      fs.writeFileAsync('./www/css/sprites-webp1.css', spritesWebpCss, 'utf-8'),
      fs.writeFileAsync('./www/css/sprites2.css', await getCss('./src/css/sprites2.css', 'utf-8')),
      fs.writeFileAsync('./www/css/sprites3.css', await getCss('./src/css/sprites3.css', 'utf-8')),
      fs.writeFileAsync('./www/css/sprites-webp2.css', await getCss('./src/css/sprites-webp2.css', 'utf-8')),
      fs.writeFileAsync('./www/css/sprites-webp3.css', await getCss('./src/css/sprites-webp3.css', 'utf-8'))
    ];
    if (debug) {
      var mainCss = await fs.readFileAsync('./src/css/style.css', 'utf-8');
      promises.push(fs.writeFileAsync('./www/css/style.css', mainCss, 'utf-8'));
    }
    await* promises;
  }

  function browserifyFile(file) {
    var opts = {
      fullPaths: debug,
      debug: debug
    };
    if (!debug) {
      opts.plugin = [bundleCollapser];
    }
    var b = browserify(opts).add(file.source)
      .transform('babelify');
    if (!debug) {
      b = b.transform('stripify');
    }
    b = b.transform(envify({
      NODE_ENV: process.env.NODE_ENV || (debug ? 'development' : 'production')
    }));
    var stream = b.bundle();
    return stream2promise(stream.pipe(fs.createWriteStream(file.dest)));
  }

  async function buildJS() {
    console.log('buildJS()');
    await mkdirp('./www/js');

    var files = [
      {
        source: __dirname + '/../src/js/client/index.js',
        dest: __dirname + '/../www/js/main.js'
      },
      {
        source: __dirname + '/../src/js/worker/index.js',
        dest: __dirname + '/../www/js/worker.js'
      },
      {
        source: __dirname + '/../src/js/serviceWorker/index.js',
        dest: __dirname + '/../www/sw.js' // ServiceWorker must live at the root
      }
    ];

    if (debug) {
      files.push({
        source: __dirname + '/../src/js/critical/index.js',
        dest: __dirname + '/../www/js/critical.js'
      })
    }

    await* files.map(browserifyFile);

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

  async function buildStatic() {
    console.log('buildStatic()');

    var promises = [
      ncp('./src/img', './www/img'),
      ncp('./src/assets', './www/assets'),
      cp('./src/robots.txt', './www/robots.txt'),
      cp('./src/favicon.ico', './www/favicon.ico'),
      cp('./src/manifest.json', './www/manifest.json'),
      ncp('./src/svg', './www/svg'),
      ncp('./src/vendor', './www/vendor')
    ];
    await* promises;
  }

  console.log('copying from src to www');
  await rimraf('./www');
  await mkdirp('./www');
  await* [buildHtml(), buildCss(), buildJS(), buildStatic()];
  console.log('wrote files to www/');
};
