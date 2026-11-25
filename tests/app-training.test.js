'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Data = require('../data-core.js');
const Training = require('../training-core.js');

const clone = value => JSON.parse(JSON.stringify(value));
const DAY = '2026-11-25';

// Execute the actual application functions with only browser presentation and
// auto-start suppressed. Storage, migration, logging, recommendation calls,
// event handlers and timer deadline calculations remain the real app code.
function harness(sharedStorage = new Map()) {
  let now = Date.parse(DAY + 'T12:00:00Z');
  let sequence = 0;
  const selectors = new Map(), intervals = new Map(), messages = [];
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  }
  const document = {
    visibilityState: 'visible', activeElement: null,
    addEventListener() {},
    getElementById(id) { return selectors.get('#' + id)?.[0] || null; },
    querySelector(selector) { return selectors.get(selector)?.[0] || null; },
    querySelectorAll(selector) { return selectors.get(selector) || []; }
  };
  const sandbox = {
    window: { HybridData: Data, HybridTraining: Training, addEventListener() {}, scrollTo() {} },
    document, navigator: { vibrate() {} }, Date: Clock, console,
    localStorage: {
      getItem(key) { return sharedStorage.has(key) ? sharedStorage.get(key) : null; },
      setItem(key, value) { sharedStorage.set(key, String(value)); },
      removeItem(key) { sharedStorage.delete(key); }
    },
    setTimeout() { return ++sequence; }, clearTimeout() {},
    setInterval(fn) { const id = ++sequence; intervals.set(id, fn); return id; },
    clearInterval(id) { intervals.delete(id); },
    __messages: messages
  };
  const context = vm.createContext(sandbox);
  const source = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8').replace(/^init\(\);\s*$/m, '');
  vm.runInContext(source + `
    render = function () {};
    toast = function (message) { __messages.push(message); };
    globalThis.appTest = {
      base: BASE, load, save, normalizeState, startSession, finishSession,
      buildDay, makeExercise, commitSession, validActualSet, dayStatus, dayKey,
      extraChoice, bindSession, timerStart, restoreRestTimer, pauseActive,
      get state() { return S; },
      setState(state) {
        S = state; hydrated = true; storageBlocked = false;
        persistedJSON = localStorage.getItem(STORAGE_KEY);
      }
    };
  `, context, { filename: 'app.js', timeout: 2000 });
  const app = sandbox.appTest;
  function state(overrides = {}, legacy = false) {
    const input = Object.assign(legacy ? {} : { schemaVersion: 4 }, clone(app.base), overrides);
    const next = Data.migrateState(input, app.base);
    app.normalizeState(next);
    app.setState(next);
    return next;
  }
  function control(selector, fields = {}) {
    const listeners = new Map();
    const element = Object.assign({
      value: '', dataset: {}, textContent: '', onclick: null, oninput: null,
      classList: { add() {}, remove() {}, toggle() {} },
      addEventListener(type, fn) { listeners.set(type, fn); },
      fire(type = 'click') {
        const event = { target: this, currentTarget: this };
        this['on' + type]?.(event);
        listeners.get(type)?.(event);
      }
    }, fields);
    const elements = selectors.get(selector) || [];
    elements.push(element); selectors.set(selector, elements);
    return element;
  }
  return {
    app, state, control, selectors, storage: sharedStorage, messages,
    now: () => now,
    advance(ms) { now += ms; },
    tick() { Array.from(intervals.values()).forEach(fn => fn()); }
  };
}

function strengthLog({ id = 'old-strength', weight = 50, reps = 10, rir = 2, date = '2026-11-24', context = 'main', device = 'standard', name = 'Bankdrücken', status = 'completed', sets = 3, cycle = 1 } = {}) {
  const meta = Training.exercise(name);
  return {
    id, type: 'strength', legacy: false, date, week: 1, cycle, day: 1,
    key: 'push', name: 'Push + Easy Run', contextId: context, duration: 45, status,
    exerciseResults: [{ id: meta.id, exercise: name, origin: 'Bankdrücken', deviceId: device,
      unit: meta.unit, weightMode: meta.weightMode, rir, prescribedSets: 3,
      sets: Array.from({ length: sets }, () => ({ kg: weight, reps, done: true })) }]
  };
}

function confirmAll(session, rir = 2) {
  for (const item of session.items) {
    item.rir = rir;
    for (const set of item.sets) {
      set.kg = item.weightMode === 'bodyweight' ? null : 20;
      if (item.unit === 'seconds') set.seconds = item.max;
      else set.reps = item.max;
      set.done = true;
    }
  }
}

test('new sessions contain proposals only, with empty actual repetitions and pending RIR', () => {
  const h = harness(); h.state(); h.app.startSession(1);
  const session = h.app.state.session;
  assert.equal(session.legacy, false);
  assert.equal(session.items.reduce((sum, item) => sum + item.sets.length, 0), 14);
  assert.ok(session.items.every(item => item.rir === null));
  for (const item of session.items) {
    assert.ok(item.sets.every(set => set.kg === null && set.reps === null && set.seconds === null && set.done === false));
  }
  const checked = Data.validateBackup(h.app.state);
  assert.equal(checked.ok, true, checked.error);
  h.app.finishSession();
  assert.equal(h.app.state.logs.length, 0);
  assert.ok(h.messages.some(message => /tatsächlich ausgeführten Satz/.test(message)));
});

test('actual set validation distinguishes external, bodyweight, added, assistance and seconds', () => {
  const { app } = harness();
  const weighted = { unit: 'reps', weightMode: 'external' };
  assert.equal(app.validActualSet({ kg: null, reps: 8 }, weighted), false);
  assert.equal(app.validActualSet({ kg: 0, reps: 8 }, weighted), false);
  assert.equal(app.validActualSet({ kg: 30, reps: null }, weighted), false);
  assert.equal(app.validActualSet({ kg: 30, reps: 8 }, weighted), true);
  assert.equal(app.validActualSet({ kg: null, reps: 8 }, { unit: 'reps', weightMode: 'bodyweight' }), true);
  assert.equal(app.validActualSet({ kg: 0, reps: 8 }, { unit: 'reps', weightMode: 'added' }), true);
  assert.equal(app.validActualSet({ kg: 0, reps: 8 }, { unit: 'reps', weightMode: 'assistance' }), true);
  assert.equal(app.validActualSet({ kg: null, reps: 30, seconds: null }, { unit: 'seconds', weightMode: 'bodyweight' }), false);
  assert.equal(app.validActualSet({ kg: null, seconds: 30 }, { unit: 'seconds', weightMode: 'bodyweight' }), true);
});

test('input handlers require real values and revoke a confirmation when a value is edited', () => {
  const h = harness(); h.state(); h.app.startSession(1);
  const kg = h.control('[data-skg]', { dataset: { skg: '0' }, value: '' });
  const reps = h.control('[data-srep]', { dataset: { srep: '0' }, value: '' });
  const done = h.control('[data-sdone]', { dataset: { sdone: '0' } });
  h.selectors.set('[data-sdone="0"]', [done]);
  const rir = h.control('#rirInput');
  h.app.bindSession();
  const item = h.app.state.session.items[0], set = item.sets[0];
  done.fire(); assert.equal(set.done, false);
  reps.value = '8'; reps.fire('input'); done.fire(); assert.equal(set.done, false);
  kg.value = '50'; kg.fire('input'); done.fire(); assert.equal(set.done, true);
  reps.value = '7'; reps.fire('input'); assert.equal(set.done, false);
  rir.value = ''; rir.fire('change'); assert.equal(item.rir, null);
  rir.value = '2'; rir.fire('change'); assert.equal(item.rir, 2);
  assert.equal(Data.validateBackup(h.app.state).ok, true);
});

test('makeExercise uses exact variant, gym and device without inheriting anchor kilograms', () => {
  const h = harness(); const state = h.state({ logs: [strengthLog()] });
  const slot = Training.PROGRAM.push[0];
  assert.equal(h.app.makeExercise(slot, 'main', 1).rec.weight, 52.5);
  const machine = h.app.makeExercise(slot, 'main', 1, 'Machine Chest Press');
  assert.equal(machine.id, Training.exercise('Machine Chest Press').id);
  assert.equal(machine.rec.weight, null);
  assert.equal(machine.rec.kind, 'new');
  assert.equal(h.app.makeExercise(slot, 'other-gym', 1).rec.weight, null);
  state.deviceSelections['main|' + Training.exercise('Bankdrücken').id] = 'another-bench';
  assert.equal(h.app.makeExercise(slot, 'main', 1).rec.weight, null);
  state.swaps['main|Bankdrücken'] = 'Push-up';
  const bodyweight = h.app.makeExercise(slot, 'main', 1);
  assert.equal(bodyweight.weightMode, 'bodyweight');
  assert.equal(bodyweight.rec.weight, null);
  assert.equal(h.app.makeExercise(slot, 'other-gym', 1).exercise, 'Bankdrücken');
});

test('swapping a repetition exercise to a timed variant also changes the prescription unit and range', () => {
  const h = harness(); h.state();
  const slot = Training.PROGRAM.deadlift.find(item => item.origin === 'Cable Crunch');
  const plank = h.app.makeExercise(slot, 'main', 1, 'Plank');
  assert.equal(plank.unit, 'seconds');
  assert.equal(plank.weightMode, 'bodyweight');
  assert.equal(plank.min, 20);
  assert.equal(plank.max, 45);
  assert.equal(plank.rec.weight, null);
});

test('partial saving is idempotent and completion preserves separate strength and run status', () => {
  const h = harness(); h.state(); h.app.startSession(1);
  const session = h.app.state.session, id = session.id;
  Object.assign(session.items[0].sets[0], { kg: 50, reps: 8, done: true });
  h.app.commitSession(12, false);
  assert.equal(h.app.state.session.id, id);
  assert.equal(h.app.state.session.paused, true);
  assert.equal(h.app.state.logs.length, 1);
  assert.equal(h.app.state.logs[0].status, 'partial');
  assert.equal(h.app.state.logs[0].exerciseResults[0].sets.length, 1);
  assert.equal(h.app.state.logs[0].exerciseResults[1].sets.length, 0);
  assert.equal(h.app.dayStatus(1).complete, false);
  assert.equal(h.app.dayStatus(1).strength, false);
  h.app.commitSession(12, false);
  assert.equal(h.app.state.logs.length, 1);
  h.app.startSession(1);
  assert.equal(h.app.state.session.id, id);
  assert.equal(h.app.state.session.items[0].sets[0].done, true);
  confirmAll(h.app.state.session);
  h.app.commitSession(48, true);
  assert.equal(h.app.state.session, null);
  assert.equal(h.app.state.logs.length, 1);
  assert.equal(h.app.state.logs[0].id, id);
  assert.equal(h.app.state.logs[0].status, 'completed');
  assert.equal(h.app.dayStatus(1).strength, true);
  assert.equal(h.app.dayStatus(1).run, false);
  assert.equal(h.app.dayStatus(1).complete, false);
  h.app.state.logs.push({ id: 'easy-run', type: 'run', date: DAY, week: 1, cycle: 1, day: 1, distance: 5, duration: 32 });
  assert.equal(h.app.dayStatus(1).complete, true);
  assert.equal(Data.validateBackup(h.app.state).ok, true);
  h.app.commitSession(48, true);
  assert.equal(h.app.state.logs.length, 2);
});

test('a closed partial workout remains partial and the latest actual work blocks an older increase', () => {
  const older = strengthLog({ id: 'older-success', weight: 40 });
  older.day = 0;
  const h = harness(); h.state({ logs: [older] });
  h.app.startSession(1);
  const s = h.app.state.session;
  Object.assign(s.items[0].sets[0], { kg: 40, reps: 6, done: true });
  s.items[0].rir = 1;
  h.app.commitSession(10, true);
  assert.equal(h.app.state.session, null);
  assert.equal(h.app.state.logs[1].status, 'partial');
  assert.equal(h.app.state.logs[1].closed, true);
  assert.equal(h.app.dayStatus(1).strength, false);
  assert.equal(h.app.dayStatus(1).complete, false);
  const proposal = h.app.makeExercise(Training.PROGRAM.push[0], 'main', 1);
  assert.equal(proposal.rec.kind, 'hold');
  assert.equal(proposal.rec.weight, 40);
});

test('an open session never uses its own saved partial record to recommend itself a heavier load', () => {
  const older = strengthLog({ id: 'older-success', weight: 40 });
  const current = strengthLog({ id: 'currently-open', weight: 50, date: DAY, status: 'partial' });
  const h = harness(); h.state({ logs: [older, current] }); h.app.startSession(1);
  h.app.state.session.id = current.id;
  const proposal = h.app.makeExercise(Training.PROGRAM.push[0], 'main', 1);
  assert.equal(proposal.rec.weight, 42.5);
  assert.equal(proposal.rec.kind, 'increase');
});

test('saved actual values survive a storage reload, remain paused, and upsert the same session on resume', async () => {
  const h = harness(); h.state(); h.app.startSession(1);
  const initial = h.app.state.session;
  Object.assign(initial.items[0].sets[0], { kg: 57.5, reps: 7, done: true });
  initial.items[0].rir = 1;
  h.app.commitSession(17.5, false);
  const checked = Data.validateBackup(h.storage.get('hybridwk-v4'));
  assert.equal(checked.ok, true, checked.error);
  const reload = harness(h.storage); await reload.app.load();
  assert.equal(reload.app.state.session.id, initial.id);
  assert.equal(reload.app.state.session.paused, true);
  assert.equal(reload.app.state.session.activeMs, 17.5 * 60000);
  assert.equal(reload.app.state.session.items[0].sets[0].kg, 57.5);
  assert.equal(reload.app.state.session.items[0].sets[0].reps, 7);
  assert.equal(reload.app.state.session.items[0].sets[0].done, true);
  assert.equal(reload.app.state.session.items[0].rir, 1);
  reload.app.startSession(1); reload.app.commitSession(18, false);
  assert.equal(reload.app.state.logs.length, 1);
  assert.equal(reload.app.state.logs[0].id, initial.id);
});

test('legacy history and draft values stay intact without inventing reported RIR or progression', () => {
  const oldLog = { type: 'strength', date: '2026-11-24', name: 'Push', key: 'push', week: 13, day: 1,
    exerciseResults: [{ origin: 'Bankdrücken', exercise: 'Bankdrücken', summary: '50×8, 50×8', rpe: 8, doneCount: 2, expected: 3 }] };
  const h = harness();
  const state = h.state({ week: 13, logs: [oldLog], session: {
    day: 1, name: 'Push', key: 'push', started: Date.parse(DAY + 'T10:00:00Z'), idx: 0,
    items: [{ origin: 'Bankdrücken', exercise: 'Bankdrücken', muscle: 'Brust', rpe: 8,
      sets: [{ kg: 50, reps: 8, done: true }, { kg: 50, reps: 8, done: false }] }]
  } }, true);
  assert.equal(state.week, 13);
  assert.equal(state.logs[0].legacy, true);
  assert.deepEqual(state.logs[0].exerciseResults, oldLog.exerciseResults);
  assert.equal(state.session.legacy, true);
  assert.equal(state.session.items[0].rpe, 8);
  assert.equal(state.session.items[0].rir, null);
  assert.equal(state.session.items[0].sets[0].kg, 50);
  assert.equal(state.session.items[0].sets[1].reps, 8);
  assert.equal(state.session.items[0].sets[1].done, false);
  const before = JSON.stringify(state.logs[0]);
  h.app.normalizeState(state);
  assert.equal(JSON.stringify(state.logs[0]), before);
  h.app.commitSession(25, true);
  assert.equal(h.app.state.logs[1].legacy, true);
  assert.equal(h.app.makeExercise(Training.PROGRAM.push[0], 'main', 13).rec.kind, 'new');
  assert.equal(Data.validateBackup(h.app.state).ok, true);
});

test('unreported RIR remains null in real logs and prevents progression after a completed session', () => {
  const h = harness(); h.state(); h.app.startSession(1);
  confirmAll(h.app.state.session, null);
  h.app.commitSession(45, true);
  assert.ok(h.app.state.logs[0].exerciseResults.every(item => item.rir === null));
  assert.equal(h.app.state.logs[0].rpe, null);
  const proposal = h.app.makeExercise(Training.PROGRAM.push[0], 'main', 1);
  assert.equal(proposal.rec.kind, 'hold');
  assert.equal(proposal.rec.weight, 20);
});

test('day completion separates strength, running and cycles, including old manual markers', () => {
  const h = harness(); const state = h.state({ cycle: 2, completed: { '1-1': true }, logs: [strengthLog({ cycle: 1 })] });
  state.logs.push({ id: 'this-cycle-run', type: 'run', date: DAY, week: 1, cycle: 2, day: 1, distance: 5, duration: 30 });
  const first = h.app.dayStatus(1);
  assert.equal(first.run, true);
  assert.equal(first.strength, false);
  assert.equal(first.manual, false);
  assert.equal(first.complete, false);
  state.logs.push(strengthLog({ id: 'this-cycle-strength', date: DAY, cycle: 2 }));
  assert.equal(h.app.dayStatus(1).complete, true);
  state.logs = [];
  state.completed[h.app.dayKey(1)] = true;
  assert.equal(h.app.dayStatus(1).complete, true);
  assert.equal(h.app.dayStatus(1).strength, false);
  assert.match(h.app.dayStatus(1).label, /keine Leistungsbestätigung/);
});

test('6-12-25 replaces Friday accessories, and a finisher replaces its own accessory slot', () => {
  const h = harness(); const state = h.state();
  state.extras[h.app.dayKey(4)] = 'tri';
  const friday = h.app.buildDay(4);
  assert.deepEqual(Array.from(friday, item => item.origin), ['Bankdrücken', 'Preacher Curl']);
  assert.equal(friday.reduce((sum, item) => sum + item.prescribedSets, 0), 6);
  state.extras[h.app.dayKey(4)] = 'finisher';
  const withFinisher = h.app.buildDay(4);
  assert.equal(withFinisher.length, Training.PROGRAM.upper.length - 1);
  assert.equal(withFinisher.some(item => item.origin === 'Hanging Knee Raise'), false);
  state.extras[h.app.dayKey(4)] = 'none';
  assert.equal(h.app.buildDay(4).length, Training.PROGRAM.upper.length);
});

test('stored extras do not silently remove exercises in light, deload or test weeks', () => {
  for (const config of [{ week: 1, lighter: true }, { week: 4 }, { week: 8 }, { week: 12 }, { week: 16 }]) {
    const h = harness();
    const state = h.state(Object.assign({ lighterDate: DAY }, config));
    state.extras[h.app.dayKey(4)] = 'tri';
    assert.equal(h.app.extraChoice(4), 'none');
    assert.equal(h.app.buildDay(4).length, Training.PROGRAM.upper.length);
    assert.equal(h.app.buildDay(4).reduce((sum, item) => sum + item.prescribedSets, 0), 7);
  }
});

test('run target normalization fills missing categories from actual runs and keeps targets across weeks', () => {
  const h = harness();
  const state = h.state({ week: 5, runTargets: { easy: 6 }, logs: [
    { id: 'quality-actual', type: 'run', date: DAY, runKind: 'quality', name: 'Quality Run', distance: 4.2, duration: 25 }
  ] });
  assert.equal(state.runTargets.easy, 6);
  assert.equal(state.runTargets.quality, 4.2);
  assert.ok(state.runTargets.long > 0);
  const targets = clone(state.runTargets);
  state.week = 11; h.app.normalizeState(state);
  assert.deepEqual(state.runTargets, targets);
});

test('rest extension adds 15 seconds to the deadline and survives rerender without resetting', () => {
  const h = harness(); h.state(); h.app.startSession(1);
  const plus = h.control('[data-plus15]');
  h.control('#timer'); h.app.bindSession(); h.app.timerStart(120);
  const original = h.app.state.session.restEnd;
  h.advance(30000); plus.fire();
  assert.equal(h.app.state.session.restEnd, original + 15000);
  h.app.restoreRestTimer();
  assert.equal(h.app.state.session.restEnd, original + 15000);
  assert.equal(Data.validateBackup(h.app.state).ok, true);
  h.advance(106000); h.tick();
  assert.equal(h.app.state.session.restEnd, null);
});
