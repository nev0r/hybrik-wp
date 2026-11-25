'use strict';

// Exercise the real application boot, import, export and persistence functions.
// The renderer is the only app function replaced: these tests do not need a
// browser layout engine, and can inject a render failure at a transaction edge.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Data = require('../data-core.js');
const Training = require('../training-core.js');
const appSource = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const KEY = 'hybridwk-v4';
const OLD_KEY = 'hybridwk-v3';
const DAY = '2026-11-25';
const plain = value => value == null ? value : JSON.parse(JSON.stringify(value));
const turn = () => new Promise(resolve => setImmediate(resolve));

class MemoryStorage {
  constructor(initial = {}) {
    this.values = new Map(Object.entries(initial));
    this.reads = [];
    this.writes = [];
    this.attempts = [];
    this.failRead = false;
    this.failWrite = false;
  }
  getItem(key) {
    this.reads.push(key);
    if (this.failRead) throw new Error('SecurityError: storage unavailable');
    return this.peek(key);
  }
  setItem(key, value) {
    const text = String(value);
    this.attempts.push({key, value: text});
    if (this.failWrite === true || (typeof this.failWrite === 'function' && this.failWrite(key, text))) {
      throw new Error('QuotaExceededError: storage full');
    }
    this.values.set(key, text);
    this.writes.push({key, value: text});
  }
  removeItem(key) { this.values.delete(key); }
  peek(key) { return this.values.has(key) ? this.values.get(key) : null; }
  externalWrite(key, value) { this.values.set(key, String(value)); }
}

function legacyState() {
  return {
    week: 13, tab: 'training', weights: {bench: 67.5, squat: 95}, pace: '5:45', pause: 90, bodyweight: 78.4,
    logs: [
      {type: 'strength', name: 'Push + Easy Run', key: 'push', week: 13, day: 1, date: DAY, duration: 43,
        load: 30.1, volume: 1200, exerciseResults: [{origin: 'Bankdrücken', exercise: 'Bankdrücken',
          summary: '50×8, 50×8', rpe: 8, doneCount: 2, expected: 3}], prs: [{exercise: 'Bankdrücken', estimated1RM: 63.3}]},
      {type: 'run', name: 'Easy Run', date: DAY, duration: 30, distance: 5.25, pace: 343, load: 15}
    ],
    routine: {[DAY]: [0, 2]}, meals: {[DAY]: {0: true, 1: false}}, rehab: {[DAY]: {hips: true}},
    sleep: [{date: DAY, hours: 7.5}], measurements: [{date: DAY, waist: 82, shoulder: 114}],
    wods: [{name: 'Eigener WOD-Eintrag', result: '6 Runden'}], swaps: {'Bankdrücken': 'Maschinenpresse'},
    completed: {'13-1': true}, restDays: ['2026-11-22'], dayOrder: {13: [1, 0, 2, 3, 5, 4, 6]},
    session: {day: 1, key: 'push', name: 'Push + Easy Run', started: 1795600000000, idx: 0, readiness: null,
      items: [{origin: 'Bankdrücken', exercise: 'Bankdrücken', muscle: 'chest', rpe: 8,
        sets: [{kg: 50, reps: 8, done: true}, {kg: 50, reps: 8, done: false}]}]},
    tri: {sessions: [{date: DAY, week: 13, muscle: 'back', setCount: 1,
      items: [{name: 'Rudern', reps: 6, kg: 40, done: true}]}], streak: 2, lastWeek: 12, lastMuscle: 'back', pausedWeek: null,
      active: {group: 'shoulders', idx: 0, started: 1795600000000,
        items: [{name: 'Seitheben', reps: 12, muscle: 'shoulders', round: 1, kg: 5, done: false}]}},
    tests: {start: {0: 60, 1: 80, 2: 40, 3: 30, date: '2026-09-01'}},
    readiness: {[DAY]: {sleep: 3, legs: 2, energy: 3}}, lighter: false, selectedDay: 1,
    loadFactors: {light: .5, normal: .7, hard: .9}, importedCsv: ['preserved-import'],
    dayMode: {'13-1': 'kraft'}, wodPick: {'finisher-13-1': 1},
    wodRun: {kind: 'finisher', day: 1, week: 13, key: 'push', id: 'old-wod-template', name: 'Upper Flow',
      format: 'AMRAP', min: 8, moves: ['Rudern', 'Push-ups'], scheme: '6 / 8', legs: 0,
      started: 1795600000000, pausedAt: null, paused: 0, rounds: 2, stopped: null,
      ended: false, manual: false, capped: false, rpe: 7},
    pendingSuggestion: {key: 'bench', delta: 2.5, reason: 'Alte Empfehlung'},
    extension: {privateNote: 'Unbekannte Metadaten bleiben erhalten'}
  };
}

function idleState() {
  const source = legacyState();
  source.session = null;
  source.tri.active = null;
  source.wodRun = null;
  source.tab = 'programm';
  return Data.migrateState(source, {});
}

function harness(options = {}) {
  const storage = options.storage || new MemoryStorage(options.initial);
  const listeners = {window: new Map(), document: new Map()};
  const elements = new Map();
  const downloads = [], blobs = new Map(), alerts = [], confirmations = [], renders = [];
  const timers = new Map();
  let timerId = 0, failRenders = 0, context;
  const on = (surface, name, callback) => {
    const list = listeners[surface].get(name) || [];
    list.push(callback);
    listeners[surface].set(name, list);
  };
  function element(id = '') {
    const node = {
      id, hidden: false, textContent: '', value: '', dataset: {}, style: {},
      classList: {add() {}, remove() {}, toggle() {}},
      addEventListener() {}, remove() { elements.delete(id); },
      matches() { return false; }, querySelectorAll() { return []; },
      appendChild() {}, focus() {}, setAttribute() {},
      click() { if (this.download) downloads.push({filename: this.download, blob: blobs.get(this.href)}); }
    };
    let html = '';
    Object.defineProperty(node, 'innerHTML', {
      get() { return html; },
      set(value) {
        html = String(value);
        for (const match of html.matchAll(/\bid="([^"]+)"/g)) {
          if (!elements.has(match[1])) elements.set(match[1], element(match[1]));
        }
      }
    });
    return node;
  }
  ['app', 'storageStatus', 'toast'].forEach(id => elements.set(id, element(id)));
  elements.get('storageStatus').hidden = true;
  const document = {
    visibilityState: 'visible', activeElement: null,
    getElementById(id) { return elements.get(id) || null; },
    querySelectorAll() { return []; },
    querySelector(selector) { return selector.startsWith('#') ? elements.get(selector.slice(1)) || null : null; },
    createElement() { return element(); },
    addEventListener(name, callback) { on('document', name, callback); },
    body: element('body')
  };
  const globals = {
    console, document, localStorage: storage, navigator: {}, Blob,
    URL: {createObjectURL(blob) { const url = 'blob:test-' + blobs.size; blobs.set(url, blob); return url; }, revokeObjectURL() {}},
    location: {reload() {}},
    alert(message) { alerts.push(String(message)); },
    confirm(message) { confirmations.push(String(message)); return options.confirm !== false; },
    setTimeout(fn) { const id = ++timerId; timers.set(id, fn); return id; },
    clearTimeout(id) { timers.delete(id); },
    setInterval(fn) { const id = ++timerId; timers.set(id, fn); return id; },
    clearInterval(id) { timers.delete(id); },
    HybridData: Data, HybridTraining: Training, scrollY: 0,
    addEventListener(name, callback) { on('window', name, callback); },
    __renderForStorageTest() {
      if (failRenders > 0) { failRenders--; throw new Error('Injected render failure'); }
      const state = plain(vm.runInContext('S', context));
      renders.push(state);
      elements.get('app').innerHTML = '<main>Rendered week ' + state.week + '</main>';
    }
  };
  if (options.provider) globals.storage = options.provider;
  globals.window = globals;
  context = vm.createContext(globals);
  // Boot still starts automatically from the unmodified application source.
  // load() awaits before init() renders, allowing this isolated renderer seam.
  vm.runInContext(appSource, context, {filename: 'app.js'});
  vm.runInContext('render = __renderForStorageTest;', context);
  return {
    context, storage, document, elements, alerts, confirmations, downloads, renders,
    run(code) { return vm.runInContext(code, context); },
    state() { return plain(vm.runInContext('S', context)); },
    async ready() { await turn(); },
    failNextRender() { failRenders++; },
    dispatch(surface, name, event = {}) { for (const handler of listeners[surface].get(name) || []) handler(event); },
    async import(value) {
      const text = typeof value === 'string' ? value : JSON.stringify(value);
      context.__input = {target: {value: 'chosen-file.json', files: [{size: Buffer.byteLength(text), async text() { return text; }}]}};
      await vm.runInContext('importBackup(__input)', context);
    },
    async backup() {
      vm.runInContext('exportBackup()', context);
      const download = downloads.at(-1);
      assert.ok(download && download.blob, 'backup must produce a downloadable Blob');
      return {filename: download.filename, value: JSON.parse(await download.blob.text())};
    }
  };
}

test('boot awaits asynchronous fallback before the first write or render, including lifecycle events', async () => {
  const old = JSON.stringify(legacyState());
  let resolveFirst;
  const first = new Promise(resolve => { resolveFirst = resolve; });
  const requested = [];
  const h = harness({provider: {async get(key) {
    requested.push(key);
    if (key === KEY) return first;
    if (key === OLD_KEY) return {value: old};
    return null;
  }}});
  await h.ready();
  assert.deepEqual(requested, [KEY]);
  assert.equal(h.run('hydrated'), false);
  assert.equal(h.state(), null);
  h.dispatch('window', 'beforeunload');
  h.document.visibilityState = 'hidden';
  h.dispatch('document', 'visibilitychange');
  assert.equal(h.storage.attempts.length, 0, 'no default state may race the asynchronous provider');
  assert.equal(h.renders.length, 0);
  resolveFirst(null);
  await h.ready();
  assert.equal(h.run('hydrated'), true);
  assert.equal(h.state().week, 13);
  assert.equal(h.state().logs.length, 2);
  assert.equal(h.storage.peek(KEY + ':before-migration'), old);
  assert.equal(JSON.parse(h.storage.peek(KEY)).week, 13);
  assert.equal(h.renders.length, 1);
});

test('an unreadable asynchronous provider never installs fresh defaults over an unknown saved state', async () => {
  const h = harness({provider: {async get() { throw new Error('Provider temporarily unavailable'); }}});
  await h.ready();
  h.dispatch('window', 'beforeunload');
  assert.equal(h.storage.peek(KEY), null, 'a failed read is not evidence that the user has no prior data');
  assert.equal(h.storage.attempts.length, 0);
  assert.ok(!h.elements.get('storageStatus').hidden || /nicht.*gelesen|erneut|Fehler/i.test(h.elements.get('app').innerHTML),
    'provider failure must be visible to the user');
});

test('v3 hydration retains the rich history and current week while preserving the original key byte-for-byte', async () => {
  const old = legacyState(), original = JSON.stringify(old);
  const h = harness({initial: {[OLD_KEY]: original}});
  await h.ready();
  const state = h.state();
  assert.equal(h.run('hydrated'), true);
  assert.equal(state.schemaVersion, 4);
  assert.equal(state.week, 13);
  assert.equal(state.cycle, 1);
  assert.equal(state.weights.bench, 67.5);
  assert.equal(state.logs.length, old.logs.length);
  assert.equal(new Set(state.logs.map(log => log.id)).size, state.logs.length);
  for (const [i, log] of old.logs.entries()) {
    for (const [key, value] of Object.entries(log)) assert.deepEqual(state.logs[i][key], value, 'log.' + key);
    assert.equal(state.logs[i].legacy, true);
  }
  for (const key of ['routine', 'meals', 'rehab', 'sleep', 'measurements', 'wods', 'swaps', 'completed',
    'restDays', 'dayOrder', 'tests', 'readiness', 'loadFactors', 'importedCsv', 'dayMode', 'wodPick', 'extension']) {
    assert.deepEqual(state[key], old[key], key);
  }
  assert.deepEqual(state.tri.sessions, old.tri.sessions);
  assert.deepEqual(state.tri.active.items, old.tri.active.items);
  assert.equal(state.session.legacy, true);
  assert.equal(state.session.paused, true);
  assert.equal(state.session.week, old.week);
  assert.equal(state.session.items[0].rpe, 8);
  assert.equal(state.session.items[0].rir, null, 'a preset legacy RPE must not fabricate actual RIR');
  for (const [i, set] of old.session.items[0].sets.entries()) {
    for (const [key, value] of Object.entries(set)) assert.equal(state.session.items[0].sets[i][key], value);
  }
  assert.equal(state.wodRun.id, old.wodRun.id);
  assert.equal(state.wodRun.started, old.wodRun.started);
  assert.deepEqual(state.wodRun.moves, old.wodRun.moves);
  assert.equal(h.storage.peek(OLD_KEY), original);
  assert.equal(h.storage.peek(KEY + ':before-migration'), original);
  assert.equal(h.storage.writes.some(write => write.key === OLD_KEY), false);
  assert.equal(Data.validateBackup(JSON.parse(h.storage.peek(KEY))).ok, true);
});

test('corrupt JSON and malformed nested v4 logs boot into recovery without overwriting any source', async () => {
  const corruptValues = ['{broken', JSON.stringify({...idleState(), logs: [null]})];
  for (const original of corruptValues) {
    const legacy = JSON.stringify(legacyState());
    const h = harness({initial: {[KEY]: original, [OLD_KEY]: legacy}});
    await h.ready();
    assert.equal(h.run('hydrated'), false);
    assert.match(h.elements.get('app').innerHTML, /nicht überschrieben/);
    h.dispatch('window', 'beforeunload');
    h.document.visibilityState = 'hidden';
    h.dispatch('document', 'visibilitychange');
    assert.equal(h.run('save()'), false);
    assert.equal(h.storage.attempts.length, 0);
    assert.equal(h.storage.peek(KEY), original);
    assert.equal(h.storage.peek(OLD_KEY), legacy);
    h.elements.get('recoverRaw').onclick();
    assert.equal(await h.downloads.at(-1).blob.text(), original, 'recovery exports exact original bytes');
  }
});

test('malformed legacy nested logs are also retained untouched during failed migration', async () => {
  const original = JSON.stringify({...legacyState(), logs: [null]});
  const h = harness({initial: {[OLD_KEY]: original}});
  await h.ready();
  assert.equal(h.run('hydrated'), false);
  assert.equal(h.storage.peek(KEY), null);
  assert.equal(h.storage.peek(OLD_KEY), original);
  h.dispatch('window', 'beforeunload');
  assert.equal(h.storage.attempts.length, 0);
});

test('a v4 backup with null logs or a null log entry is rejected before confirmation or mutation', async () => {
  const h = harness({initial: {[KEY]: JSON.stringify(idleState())}});
  await h.ready();
  const before = h.state(), original = h.storage.peek(KEY), attempts = h.storage.attempts.length;
  for (const logs of [null, [null]]) {
    await h.import({format: 'hybridwk-backup', version: 4, state: {...before, logs}});
    assert.deepEqual(h.state(), before);
    assert.equal(h.storage.peek(KEY), original);
    assert.equal(h.storage.attempts.length, attempts);
    assert.equal(h.confirmations.length, 0);
    assert.match(h.alerts.at(-1), /Backup nicht übernommen/);
  }
});

test('quota failures visibly warn and still export the latest unsaved in-memory state', async () => {
  const h = harness({initial: {[KEY]: JSON.stringify(idleState())}});
  await h.ready();
  const original = h.storage.peek(KEY);
  h.storage.failWrite = true;
  assert.equal(h.run('S.bodyweight = 81.5; save()'), false);
  const notice = h.elements.get('storageStatus');
  assert.equal(notice.hidden, false);
  assert.match(notice.textContent, /nicht gespeichert|Backup/i);
  assert.equal(h.storage.peek(KEY), original);
  const backup = await h.backup();
  assert.match(backup.filename, /^hybridwk-backup-.*\.json$/);
  assert.equal(backup.value.format, 'hybridwk-backup');
  assert.equal(backup.value.state.bodyweight, 81.5);
  assert.equal(backup.value.state.logs.length, 2);
  assert.equal(Data.validateBackup(backup.value).ok, true);
  assert.equal(h.storage.peek(KEY), original);
});

test('unavailable local storage can hydrate the async provider and keeps an export available', async () => {
  const storage = new MemoryStorage();
  storage.failRead = true;
  const old = JSON.stringify(legacyState());
  const h = harness({storage, provider: {async get(key) { return key === OLD_KEY ? {value: old} : null; }}});
  await h.ready();
  assert.equal(h.run('hydrated'), true);
  assert.equal(h.state().week, 13);
  assert.equal(h.elements.get('storageStatus').hidden, false);
  assert.match(h.elements.get('storageStatus').textContent, /Browserspeicher.*nicht verfügbar/);
  assert.equal(storage.attempts.length, 0);
  const backup = await h.backup();
  assert.equal(backup.value.state.logs.length, 2);
  assert.equal(backup.value.state.week, 13);
  assert.equal(Data.validateBackup(backup.value).ok, true);
});

test('a stale parallel window cannot overwrite a newer authoritative snapshot and can export its own edits', async () => {
  const storage = new MemoryStorage({[KEY]: JSON.stringify(idleState())});
  const first = harness({storage});
  await first.ready();
  const stale = harness({storage});
  await stale.ready();
  assert.equal(first.run('S.bodyweight = 82; save()'), true);
  const authoritative = storage.peek(KEY);
  assert.equal(stale.run('S.bodyweight = 74; save()'), false);
  assert.equal(storage.peek(KEY), authoritative);
  assert.equal(JSON.parse(storage.peek(KEY + ':parallel-window')).bodyweight, 74);
  assert.equal(stale.elements.get('storageStatus').hidden, false);
  assert.match(stale.elements.get('storageStatus').textContent, /anderes App-Fenster|neuere Daten/);
  stale.dispatch('window', 'beforeunload');
  assert.equal(storage.peek(KEY), authoritative);
  const backup = await stale.backup();
  assert.equal(backup.value.state.bodyweight, 74);
  assert.equal(storage.peek(KEY), authoritative);
});

test('accepted replacement creates a recoverable snapshot before making the candidate authoritative', async () => {
  const h = harness({initial: {[KEY]: JSON.stringify(idleState())}});
  await h.ready();
  const previous = h.state(), baselineWrites = h.storage.writes.length;
  const candidate = {...previous, week: 16, bodyweight: 79.2};
  await h.import({format: 'hybridwk-backup', version: 4, state: candidate});
  assert.equal(h.confirmations.length, 1);
  assert.equal(h.alerts.length, 0);
  assert.deepEqual(JSON.parse(h.storage.peek(KEY + ':before-import')), previous);
  const transaction = h.storage.writes.slice(baselineWrites);
  assert.equal(transaction[0].key, KEY + ':before-import');
  assert.equal(transaction[1].key, KEY);
  assert.equal(h.state().week, 16);
  assert.equal(JSON.parse(h.storage.peek(KEY)).week, 16);
});

test('failed replacement rendering restores both memory and authoritative storage to the previous snapshot', async () => {
  const h = harness({initial: {[KEY]: JSON.stringify(idleState())}});
  await h.ready();
  const previous = h.state(), previousJSON = h.storage.peek(KEY);
  h.failNextRender();
  await h.import({format: 'hybridwk-backup', version: 4, state: {...previous, week: 16}});
  assert.match(h.alerts.at(-1), /Backup nicht übernommen.*Injected render failure/);
  assert.deepEqual(h.state(), previous);
  assert.equal(h.storage.peek(KEY), previousJSON);
  assert.deepEqual(JSON.parse(h.storage.peek(KEY + ':before-import')), previous);
  assert.deepEqual(h.renders.at(-1), previous);
  assert.equal(h.run('save()'), true, 'the restored revision remains writable');
});

test('failure to persist the safety snapshot aborts replacement before changing the original', async () => {
  const h = harness({initial: {[KEY]: JSON.stringify(idleState())}});
  await h.ready();
  const previous = h.state(), previousJSON = h.storage.peek(KEY);
  h.storage.failWrite = key => key === KEY + ':before-import';
  await h.import({format: 'hybridwk-backup', version: 4, state: {...previous, week: 16}});
  assert.match(h.alerts.at(-1), /Backup nicht übernommen/);
  assert.deepEqual(h.state(), previous);
  assert.equal(h.storage.peek(KEY), previousJSON);
  assert.equal(h.storage.peek(KEY + ':before-import'), null);
});

test('declining a valid replacement preserves state and does not create backup side effects', async () => {
  const h = harness({initial: {[KEY]: JSON.stringify(idleState())}, confirm: false});
  await h.ready();
  const previous = h.state(), previousJSON = h.storage.peek(KEY), writes = h.storage.writes.length;
  await h.import({format: 'hybridwk-backup', version: 4, state: {...previous, week: 16}});
  assert.equal(h.confirmations.length, 1);
  assert.equal(h.storage.writes.length, writes);
  assert.deepEqual(h.state(), previous);
  assert.equal(h.storage.peek(KEY), previousJSON);
});

test('a real v4 strength session and its partial log survive backup and hydration with the same identity', async () => {
  const h = harness({initial: {[KEY]: JSON.stringify(idleState())}});
  await h.ready();
  const day = h.run('weekOrder().findIndex(i => PLAN[i].key === "squat")');
  h.run('startSession(' + day + ')');
  assert.ok(h.state().session, 'real application session creation must succeed');
  h.run(`
    S.session.items[0].sets[0] = {kg: 40, reps: 8, seconds: null, done: true};
    S.session.items[0].rir = 2;
    commitSession(22, false);
  `);
  const before = h.state(), id = before.session.id;
  assert.equal(before.logs.find(log => log.id === id).status, 'partial');
  assert.equal(before.session.legacy, false);
  assert.ok(before.session.items[0].rec, 'real recommendation metadata is included in the stored snapshot');
  assert.equal(Data.validateBackup((await h.backup()).value).ok, true);
  const reopened = harness({storage: h.storage});
  await reopened.ready();
  assert.equal(reopened.run('hydrated'), true);
  assert.equal(reopened.state().session.id, id);
  assert.equal(reopened.state().session.paused, true);
  assert.deepEqual(reopened.state().session.items, before.session.items);
  assert.equal(reopened.state().session.items[0].rir, 2);
  assert.equal(reopened.state().session.activeMs, 22 * 60000);
  reopened.run('commitSession(23, true)');
  const after = reopened.state();
  assert.equal(after.session, null);
  assert.equal(after.logs.filter(log => log.id === id).length, 1, 'finishing an existing partial log updates it');
  const log = after.logs.find(entry => entry.id === id);
  assert.equal(log.duration, 23);
  assert.equal(log.legacy, false);
  assert.equal(log.exerciseResults[0].sets[0].done, true);
  assert.equal(log.exerciseResults[0].sets[0].kg, 40);
  assert.equal(log.exerciseResults[0].rir, 2);
  assert.equal(Data.validateBackup((await reopened.backup()).value).ok, true);
});

test('a real v4 tri-set preserves actual repetitions through pause, hydration and history export', async () => {
  const h = harness({initial: {[KEY]: JSON.stringify(idleState())}});
  await h.ready();
  const day = h.run('weekOrder().findIndex(i => PLAN[i].key === "upper")');
  h.run(`
    S.selectedDay = ${day};
    S.extras[dayKey(${day})] = 'tri';
    startSession(${day});
    S.session.items.forEach(item => item.sets.forEach(set => Object.assign(set, {kg: 20, reps: item.min, done: true})));
    commitSession(30, true);
    startTri('shoulders');
  `);
  assert.ok(h.state().tri.active, 'the actual shortened strength workflow unlocks the tri-set');
  h.run(`
    S.tri.active.items[0].kg = 25;
    S.tri.active.items[0].actualReps = 6;
    S.tri.active.items[0].done = true;
    S.tri.active.activeMs = 180000;
    pauseActive(); save();
  `);
  const active = h.state().tri.active, id = active.logId;
  assert.equal(Data.validateBackup((await h.backup()).value).ok, true);
  const reopened = harness({storage: h.storage});
  await reopened.ready();
  assert.equal(reopened.run('hydrated'), true);
  assert.equal(reopened.state().tri.active.logId, id);
  assert.equal(reopened.state().tri.active.paused, true);
  assert.deepEqual(reopened.state().tri.active.items, active.items);
  reopened.run('finishTri()');
  const state = reopened.state();
  assert.equal(state.tri.active, null);
  const record = state.tri.sessions.find(entry => entry.id === id);
  assert.ok(record);
  assert.equal(record.items[0].actualReps, 6);
  assert.equal(record.items[0].kg, 25);
  assert.equal(record.setCount, 1);
  assert.equal(state.logs.filter(log => log.id === id).length, 1);
  assert.equal(state.logs.find(log => log.id === id).type, 'accessory');
  assert.equal(Data.validateBackup((await reopened.backup()).value).ok, true);
});

test('a real v4 WOD preserves template and log identities through hydration and completion', async () => {
  const h = harness({initial: {[KEY]: JSON.stringify(idleState())}});
  await h.ready();
  const day = h.run('weekOrder().findIndex(i => PLAN[i].key === "push")');
  h.run(`S.dayMode[dayKey(${day})] = 'crossfit'; wodStart('crossfit', ${day}, false);`);
  assert.ok(h.state().wodRun);
  h.run('S.wodRun.started = Date.now() - 60000; S.wodRun.rounds = 2; save();');
  const active = h.state().wodRun;
  assert.ok(active.logId);
  assert.notEqual(active.id, active.logId);
  assert.equal(Data.validateBackup((await h.backup()).value).ok, true);
  const reopened = harness({storage: h.storage});
  await reopened.ready();
  assert.equal(reopened.run('hydrated'), true);
  assert.equal(reopened.state().wodRun.id, active.id);
  assert.equal(reopened.state().wodRun.logId, active.logId);
  assert.equal(reopened.state().wodRun.started, active.started);
  assert.ok(reopened.state().wodRun.pausedAt, 'a restored workout must not silently keep timing');
  assert.equal(reopened.run('wodSave({rounds: 3, reps: 5, time: "00:30", total: 20, capped: false, note: "Stored result"})'), '');
  const state = reopened.state(), log = state.logs.find(entry => entry.id === active.logId);
  assert.equal(state.wodRun, null);
  assert.ok(log);
  assert.equal(log.wodId, active.id);
  assert.equal(log.type, 'crossfit');
  assert.equal(log.note, 'Stored result');
  assert.equal(Data.validateBackup((await reopened.backup()).value).ok, true);
});
