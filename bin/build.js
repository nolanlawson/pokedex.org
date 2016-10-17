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
var autoprefixer = require('autoprefixer');
var postcss = require('postcss');
var execall = require('execall');
var minifyHtml = require('html-minifier').minify;
var bundleCollapser = require("bundle-collapser/plugin");
var envify = require('envify/custom');
var vdomify = require('./vdomify');
var concat = require('concat-stream');
var watch = require('node-watch');

var constants = require('../src/js/shared/util/constants');
var numSpritesCssFiles = constants.numSpriteCssFiles;
var initialWindowSize = constants.initialWindowSize;
var renderMonsterDetailView = require('../src/js/shared/renderMonsterDetailView');
var renderMonstersList = require('../src/js/shared/renderMonstersList');
var monsterSummaries = require('../src/js/shared/data/monsterSummaries');
var bulbasaur = require('../src/js/shared/data/bulbasaur');
var toHtml = require('vdom-to-html');
var splitFile = require('./split-file');

var CRITICAL_CSS_SPRITES_LINES = 8;

module.exports = async function build(debug) {

  async function minifyCss(css) {
    var processed = await postcss([ autoprefixer ]).process(css);
    css = processed.css;
    return cleanCss.minify(css).styles;
  }

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

  async function inlineCriticalJs() {
    console.log('inlineCriticalJs()');
    var html = await fs.readFileAsync(__dirname + '/../www/index.html', 'utf-8');
    var common = await fs.readFileAsync(__dirname + '/../www/js/common.js', 'utf-8');
    var crit = await fs.readFileAsync(__dirname + '/../www/js/critical.js', 'utf-8');

    html = html.replace(
      '<script src=js/critical.js></script>',
      `<script>${crit}</script>`)
      .replace(
      '<script src=js/common.js></script>',
      `<script>${common}</script>`);

    await fs.writeFileAsync(__dirname + '/../www/index.html', html, 'utf-8');
  }

  async function inlineCriticalCss(html) {
    var mainCss = await fs.readFileAsync('./src/css/style.css', 'utf-8');
    var spritesCss = await fs.readFileAsync('./src/css/sprites.css', 'utf-8');

    mainCss += '\n' +
      spritesCss.split('\n').slice(0, CRITICAL_CSS_SPRITES_LINES).join('\n');

    mainCss = await inlineSvgs(mainCss);
    mainCss = await minifyCss(mainCss);
    var muiCss = await fs.readFileAsync('./src/vendor/mui.css', 'utf-8');
    muiCss = await minifyCss(muiCss);
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
    var monstersList = renderMonstersList(monsterSummaries,
      0, initialWindowSize);
    html = html.replace('<ul id="monsters-list"></ul>',
      toHtml(monstersList));

    var monsterDetailHtml = renderMonsterDetailView(bulbasaur);
    html = html.replace('<div id="detail-view"></div>',
      toHtml(monsterDetailHtml));

    if (!debug) {
      html = await inlineCriticalCss(html);
      html = await inlineVendorJs(html);
      html = minifyHtml(html, {removeAttributeQuotes: true});
    }
    await fs.writeFileAsync('./www/index.html', html, 'utf-8');
  }

  async function writeSplitCss(css, filename, numParts) {
    css = css.split('\n');
    var batchSize = (css.length / numParts);
    var counter = 1;
    var promises = [];
    for (var i = 0; i < css.length; i += batchSize) {
      var end = Math.min(batchSize, css.length);
      var cssPart = css.slice(i, i + end).join('\n');
      var partFile = filename.replace(/\.css$/, `-${counter}.css`);
      if (!debug) {
        cssPart = await minifyCss(cssPart);
      }
      promises.push(fs.writeFileAsync(partFile, cssPart, 'utf-8'));
      counter++;
    }
    return await Promise.all(promises);
  }

  async function buildCss() {
    console.log('buildCss()');
    var spritesCss = await fs.readFileAsync('./src/css/sprites.css', 'utf-8');
    var spritesWebpCss = await fs.readFileAsync('./src/css/sprites-webp.css', 'utf-8');

    if (!debug) {
      spritesCss = spritesCss.split('\n').slice(CRITICAL_CSS_SPRITES_LINES).join('\n');
      spritesWebpCss = spritesWebpCss.split('\n').slice(CRITICAL_CSS_SPRITES_LINES).join('\n');
    }

    await mkdirp('./www/css');

    var promises = [
      writeSplitCss(spritesCss, './www/css/sprites.css', numSpritesCssFiles),
      writeSplitCss(spritesWebpCss, './www/css/sprites-webp.css', numSpritesCssFiles),
    ];
    if (debug) {
      var mainCss = await fs.readFileAsync('./src/css/style.css', 'utf-8');
      promises.push(fs.writeFileAsync('./www/css/style.css', mainCss, 'utf-8'));
    }

    await Promise.all(promises);
  }

  function startBrowserify(files) {
    var opts = {
      fullPaths: debug,
      debug: debug
    };
    if (!debug) {
      opts.plugin = [bundleCollapser];
    }
    var b = browserify(files, opts);
    b = b.transform('async-await-browserify').transform('babelify');
    if (debug) {
      b = b.plugin('errorify');
    } else {
      b = b.transform('package-json-versionify')
        .transform({global: true}, 'stripify')
        .transform({global: true}, 'uglifyify');
    }
    b = b.transform(vdomify).transform(envify({
      NODE_ENV: process.env.NODE_ENV || (debug ? 'development' : 'production')
    }));
    return b;
  }

  function browserifyAndWriteFile(file) {
    var stream = startBrowserify([file.source]).bundle();
    return stream2promise(stream.pipe(fs.createWriteStream(file.dest)));
  }

  async function buildJS() {
    console.log('buildJS()');
    await mkdirp('./www/js');

    var files = [
      {
        source: __dirname + '/../src/js/worker/index.js',
        dest: __dirname + '/../www/js/worker.js'
      },
      {
        source: __dirname + '/../src/js/serviceWorker/index.js',
        dest: __dirname + '/../www/sw.js' // ServiceWorker must live at the root
      }
    ];

    var browserifyPromises = files.map(browserifyAndWriteFile);

    var factorPromise;

    if (debug) {
      // avoid the  factor-bundle for faster reload times
      factorPromise = bluebird.all([
        browserifyAndWriteFile({
          source: __dirname + '/../src/js/client/main/index.js',
          dest: __dirname + '/../www/js/main.js'
        }),
        browserifyAndWriteFile({
          source: __dirname + '/../src/js/client/critical/index.js',
          dest: __dirname + '/../www/js/critical.js'
        }),
        fs.writeFileAsync(__dirname + '/../www/js/common.js', '')
      ]);
    } else {
      // do a factor-bundle to split up the worker and critical stuff
      factorPromise = new Promise(function (resolve) {
        var numDone = 0;
        var checkDone = () => {
          if (++numDone == 3) {
            resolve();
          }
        };

        var files = [
          __dirname + '/../src/js/client/main/index.js',
          __dirname + '/../src/js/client/critical/index.js'
        ];
        var b = startBrowserify(files);

        b.plugin('factor-bundle', {outputs: [write('main.js'), write('critical.js')]});
        b.bundle().pipe(write('common.js')).on('end', checkDone);

        function write(name) {
          return concat(function (body) {
            fs.writeFile(__dirname + '/../www/js/' + name, body, 'utf-8', checkDone);
          });
        }
      });
    }

    await Promise.all([...browserifyPromises, factorPromise]);

    var allOutputFiles = [
      __dirname + '/../www/js/worker.js',
      __dirname + '/../www/sw.js',
      __dirname + '/../www/js/main.js',
      __dirname + '/../www/js/critical.js',
      __dirname + '/../www/js/common.js'
    ];

    if (!debug) {
      await Promise.all(allOutputFiles.map(function (file) {
        var code = uglify.minify(file, {
          mangle: true,
          compress: true
        }).code;

        return fs.writeFileAsync(file, code, 'utf-8');
      }));
    }
  }

  async function buildStatic() {
    console.log('buildStatic()');

    await mkdirp('./www/assets');

    var promises = [
      ncp('./src/img', './www/img'),
      cp('./src/robots.txt', './www/robots.txt'),
      cp('./src/favicon.ico', './www/favicon.ico'),
      cp('./src/manifest.json', './www/manifest.json'),
      ncp('./src/svg', './www/svg'),
      ncp('./src/vendor', './www/vendor'),
      cp('./src/assets/evolutions.txt', './www/assets/evolutions.txt'),
      cp('./src/assets/types.txt', './www/assets/types.txt'),
      splitFile('./src/assets/monster-moves.txt', './www/assets/monster-moves.txt', 100),
      splitFile('./src/assets/descriptions.txt', './www/assets/descriptions.txt', 100),
      splitFile('./src/assets/monsters-supplemental.txt', './www/assets/monsters-supplemental.txt', 100),
      splitFile('./src/assets/skim-monsters.txt', './www/assets/skim-monsters.txt', 100),
      splitFile('./src/assets/moves.txt', './www/assets/moves.txt', 100)
    ];

    await Promise.all(promises);
  }

  console.log('building...');
  await rimraf('./www');
  await mkdirp('./www');

  async function buildProd() {
    console.log('buildProd()');
    await Promise.all([buildHtml(), buildCss(), buildJS(), buildStatic()]);
    await inlineCriticalJs();
    console.log('wrote files to www/');
  }

  async function buildDev() {
    console.log('buildDev()');
    await Promise.all([buildHtml(), buildCss(), buildJS(), buildStatic()]);
    console.log('wrote files to www/');
    watch('src/index.html', {recursive: true}, async () => {
      await buildHtml();
      console.log('rebuild html');
    });
    watch('src/js', {recursive: true}, async () => {
      await Promise.all([buildHtml(), buildJS()]);
      console.log('rebuild html+js');
    });
    watch('src/css', {recursive: true}, async () => {
      await Promise.all([buildHtml(), buildCss()]);
      console.log('rebuild html+css');
    });
  }

  if (debug) {
    await buildDev();
  } else {
    await buildProd();
  }
};
