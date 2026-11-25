'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

function harness(options = {}) {
  const scope = 'https://nev0r.github.io/hybrik-wp/';
  const events = {};
  const opened = [], deleted = [], network = [], batches = [];
  let claimed = 0, forced = 0;
  const cache = {
    async addAll(assets) {
      batches.push(Array.from(assets));
      if (options.installFail) throw new Error('Missing app dependency');
    },
    async match(request) {
      const url = typeof request === 'string' ? new URL(request, scope).href : request.url;
      return options.cached && options.cached[url];
    }
  };
  vm.runInNewContext(source, {
    URL, Set,
    self: {
      registration: {scope},
      location: {origin: new URL(scope).origin},
      clients: {async claim() { claimed++; }},
      async skipWaiting() { forced++; },
      addEventListener(name, callback) { events[name] = callback; }
    },
    caches: {
      async open(name) { opened.push(name); return cache; },
      async keys() { return options.keys || []; },
      async delete(name) { deleted.push(name); return true; }
    },
    async fetch(request) {
      network.push(request.url);
      if (options.networkFail) throw new Error('Offline');
      return {network: request.url};
    }
  });
  return {
    scope, opened, deleted, network, batches,
    get claimed() { return claimed; },
    get forced() { return forced; },
    lifecycle(name) {
      let pending;
      events[name]({waitUntil(promise) { pending = promise; }});
      return pending;
    },
    request(pathname, mode = 'cors', method = 'GET') {
      let response;
      events.fetch({
        request: {url: new URL(pathname, scope).href, mode, method},
        respondWith(promise) { response = promise; }
      });
      return response;
    }
  };
}

test('installation caches the complete relative app shell in one atomic batch', async () => {
  const h = harness();
  await h.lifecycle('install');
  assert.equal(h.batches.length, 1);
  assert.deepEqual(h.batches[0], [
    './index.html', './base.css', './redesign.css', './data-core.js',
    './training-core.js', './app.js', './manifest.webmanifest',
    './icon-180.png', './icon-512.png'
  ]);
  assert.match(h.opened[0], /^hybridwk-v4-/);
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  for (const [, file] of html.matchAll(/(?:src|href)="([^"#]+\.(?:js|css|webmanifest|png))"/g)) {
    assert.ok(h.batches[0].includes('./' + file.replace(/^\.\//, '')), file + ' is not precached');
  }
  assert.equal(h.forced, 0, 'an update must not interrupt an open workout');
});

test('a missing shell asset rejects installation without activating a partial version', async () => {
  const h = harness({installFail: true});
  await assert.rejects(h.lifecycle('install'), /Missing app dependency/);
  assert.equal(h.claimed, 0);
  assert.equal(h.forced, 0);
});

test('activation removes only previous Hybrid/Wk caches and keeps the current version', async () => {
  const install = harness();
  await install.lifecycle('install');
  const current = install.opened[0];
  const h = harness({keys: ['hybridwk-v5', 'hybridwk-v3', current, 'snecki-45min-v2', 'another-app-cache']});
  await h.lifecycle('activate');
  assert.deepEqual(h.deleted, ['hybridwk-v5', 'hybridwk-v3']);
  assert.equal(h.claimed, 1);
});

test('offline navigation uses the shell at a GitHub Pages subpath', async () => {
  const html = {html: true};
  const h = harness({networkFail: true, cached: {'https://nev0r.github.io/hybrik-wp/index.html': html}});
  assert.equal(await h.request('./', 'navigate'), html);
  assert.equal(await h.request('./index.html?day=2', 'navigate'), html);
  assert.deepEqual(h.network, []);
});

test('a missing script never receives the cached HTML navigation shell', async () => {
  const h = harness({networkFail: true, cached: {'https://nev0r.github.io/hybrik-wp/index.html': {html: true}}});
  await assert.rejects(h.request('./app.js'), /Offline/);
  await assert.rejects(h.request('./training-core.js'), /Offline/);
  await assert.rejects(h.request('./base.css'), /Offline/);
  assert.equal(h.request('./missing.js'), undefined);
});

test('cached dependencies retain their content and a cache miss uses its own network request', async () => {
  const script = {javascript: true};
  const h = harness({cached: {'https://nev0r.github.io/hybrik-wp/app.js': script}});
  assert.equal(await h.request('./app.js'), script);
  assert.deepEqual(await h.request('./base.css'), {network: h.scope + 'base.css'});
  assert.deepEqual(await h.request('./', 'navigate'), {network: h.scope});
});

test('the worker ignores other apps, cross-origin requests and non-GET methods', () => {
  const h = harness();
  assert.equal(h.request('/Snecki/index.html', 'navigate'), undefined);
  assert.equal(h.request('/hybrik-wp-other/index.html', 'navigate'), undefined);
  assert.equal(h.request('https://example.com/hybrik-wp/index.html', 'navigate'), undefined);
  assert.equal(h.request('./index.html', 'navigate', 'POST'), undefined);
  assert.equal(h.request('./api/export'), undefined);
  assert.deepEqual(h.opened, []);
  assert.deepEqual(h.network, []);
});

test('the installable app uses the new theme and relative GitHub Pages paths', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
  assert.equal(manifest.name, 'Hybrid/Wk');
  assert.equal(manifest.short_name, 'Hybrid/Wk');
  assert.equal(manifest.theme_color, '#edf2f7');
  assert.equal(manifest.background_color, '#edf2f7');
  assert.equal(manifest.start_url, './index.html');
  assert.equal(manifest.scope, './');
  for (const icon of manifest.icons) assert.ok(icon.src.startsWith('./'));
});
