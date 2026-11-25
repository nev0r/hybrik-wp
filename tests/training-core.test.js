'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const training = require('../training-core.js');

function performance(name = 'Bankdrücken', changes = {}) {
  const meta = training.exercise(name);
  return Object.assign({
    id: meta.id, exercise: name, origin: name, deviceId: 'standard',
    unit: meta.unit, weightMode: meta.weightMode, rir: 2, prescribedSets: 3,
    sets: Array.from({ length: 3 }, () => ({ kg: 50, reps: 10, done: true }))
  }, changes);
}
function log(exercise = performance(), changes = {}) {
  return Object.assign({
    id: 'session-1', type: 'strength', legacy: false, date: '2026-11-24T10:00:00Z',
    contextId: 'main', exerciseResults: [exercise]
  }, changes);
}
function request(logs, changes = {}) {
  return Object.assign({
    logs, exerciseId: training.exercise('Bankdrücken').id, contextId: 'main',
    deviceId: 'standard', sets: 3, min: 8, max: 10, week: 1, step: 2.5
  }, changes);
}

test('the browser build exposes the same standalone API', () => {
  const sandbox = {};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../training-core.js'), 'utf8'), sandbox);
  assert.equal(typeof sandbox.HybridTraining.recommend, 'function');
  assert.equal(sandbox.HybridTraining.PROGRAM.push[0].name, 'Bankdrücken');
});

test('the five-day program has 61 sets, bench twice, and complete alternative metadata', () => {
  assert.deepEqual(Object.keys(training.PROGRAM), ['squat', 'push', 'pull', 'deadlift', 'upper']);
  const entries = Object.values(training.PROGRAM).flat();
  assert.equal(entries.reduce((sum, item) => sum + item.sets, 0), 61);
  assert.equal(entries.filter(item => item.name === 'Bankdrücken').length, 2);
  assert.equal(training.PROGRAM.deadlift.some(item => item.name === 'Romanian Deadlift'), false);
  for (const entry of entries) {
    assert.ok(entry.sets >= 2 && entry.sets <= 3);
    assert.ok(entry.min > 0 && entry.max >= entry.min && entry.rest >= 60);
    const alternatives = training.alternatives(entry.origin);
    assert.ok(alternatives.length >= 2 && alternatives.length <= 4, entry.name);
    for (const name of [entry.name, ...alternatives]) {
      const meta = training.exercise(name);
      assert.equal(meta.known, true, name);
      assert.ok(meta.id && meta.cue && meta.weightNote);
      assert.ok(['reps', 'seconds'].includes(meta.unit));
      assert.ok(['external', 'bodyweight', 'added', 'assistance'].includes(meta.weightMode));
      assert.equal(/nordic/i.test(name), false);
    }
  }
  assert.equal(training.exercise('Seated Hamstring Curl').id, training.exercise('Seated Leg Curl').id);
});

test('recommendation never invents a starting weight', () => {
  assert.deepEqual(training.recommend(request([])).weight, null);
  assert.equal(training.recommend(request([])).kind, 'new');
  assert.equal(training.exercise('Custom machine').known, false);
  assert.equal(training.recommend(request([], { exerciseId: 'custom-machine' })).weight, null);
});

test('a first timed exercise recommends a clean hold in seconds without rep-reserve or kilogram cues', () => {
  for (const name of ['Plank', 'Weighted Plank']) {
    const proposal = training.recommend(request([], {
      exerciseId: training.exercise(name).id, min: 25, max: 40
    }));
    assert.equal(proposal.kind, 'new');
    assert.equal(proposal.weight, null);
    assert.match(proposal.message, /25–40 Sekunden/);
    assert.doesNotMatch(proposal.message, /Wiederhol|Reserve|RIR|kg|Kilogramm/i);
  }
  const fallback = training.recommend({ logs: [], exerciseId: training.exercise('Plank').id });
  assert.match(fallback.message, /20–45 Sekunden/);
});

test('a first bodyweight exercise recommends its rep range without an invented load', () => {
  const proposal = training.recommend(request([], {
    exerciseId: training.exercise('Klimmzüge strikt').id, min: 4, max: 8
  }));
  assert.equal(proposal.kind, 'new');
  assert.equal(proposal.weight, null);
  assert.match(proposal.message, /4–8 Wiederholungen/);
  assert.doesNotMatch(proposal.message, /kg|Kilogramm|Zusatzgewicht/i);
});

test('exact exercise, gym and device isolate performances, even with identical origins', () => {
  const benchmark = log(performance());
  const otherVariant = log(performance('DB Bench Press', { origin: 'Bankdrücken' }), { date: '2026-11-25' });
  const otherGym = log(performance(), { contextId: 'other-gym', date: '2026-11-26' });
  const otherDevice = log(performance('Bankdrücken', { deviceId: 'machine-2' }), { date: '2026-11-27' });
  const logs = [benchmark, otherVariant, otherGym, otherDevice];
  const last = training.getLastPerformance(logs, request(logs));
  assert.equal(last.entry, benchmark);
  assert.equal(training.getLastPerformance([otherVariant], request([])), null);
  assert.equal(training.getLastPerformance([otherGym], request([])), null);
  assert.equal(training.getLastPerformance([otherDevice], request([])), null);
});

test('latest actual performance wins by date, then original order', () => {
  const older = log(performance(), { date: '2026-11-20' });
  const newer = log(performance('Bankdrücken', { rir: 0 }), { date: '2026-11-24' });
  assert.equal(training.getLastPerformance([newer, older], request([])).entry, newer);
  const sameDate = log(performance('Bankdrücken', { rir: 1 }), { date: '2026-11-24' });
  assert.equal(training.getLastPerformance([newer, sameDate], request([])).entry, sameDate);
});

test('legacy, summary-only, unconfirmed and incorrectly labelled sets cannot drive progression', () => {
  const cases = [
    log(performance(), { legacy: true }),
    log(performance('Bankdrücken', { legacy: true })),
    log(performance('Bankdrücken', { sets: undefined, summary: '50×10, 50×10, 50×10' })),
    log(performance('Bankdrücken', { sets: [{ kg: 50, reps: 10, done: false }] })),
    log(performance('Bankdrücken', { unit: 'seconds' })),
    log(performance('Bankdrücken', { weightMode: 'added' })),
    log(performance('Bankdrücken', { unit: undefined, weightMode: undefined }))
  ];
  for (const entry of cases) {
    assert.equal(training.getLastPerformance([entry], request([])), null);
    assert.equal(training.recommend(request([entry])).kind, 'new');
    assert.equal(training.recommend(request([entry])).weight, null);
  }
});

test('all prescribed confirmed sets at the upper range with RIR 2 increase by the actual step', () => {
  const result = training.recommend(request([log()]));
  assert.equal(result.kind, 'increase');
  assert.equal(result.weight, 52.5);
  assert.equal(training.recommend(request([log()], { step: 1.25 })).weight, 51.25);
  const numericStrings = performance('Bankdrücken', { rir: '2', sets: Array.from({ length: 3 }, () => ({ weight: '50', reps: '10', confirmed: true })) });
  assert.equal(training.recommend(request([log(numericStrings)])).weight, 52.5);
});

test('missing actual RIR holds and never substitutes the old prefilled RPE', () => {
  for (const rir of [undefined, null, '', ' ', -1, 'unknown']) {
    const result = training.recommend(request([log(performance('Bankdrücken', { rir, rpe: 6 }))]));
    assert.equal(result.kind, 'hold');
    assert.equal(result.weight, 50);
  }
});

test('per-set RIR must be documented for every set and uses the least reserve', () => {
  const sets = [2, 3, 2].map(rir => ({ kg: 50, reps: 10, done: true, rir }));
  assert.equal(training.recommend(request([log(performance('Bankdrücken', { rir: null, sets }))])).kind, 'increase');
  sets[2].rir = 1;
  assert.equal(training.recommend(request([log(performance('Bankdrücken', { rir: null, sets }))])).kind, 'hold');
  delete sets[2].rir;
  assert.equal(training.recommend(request([log(performance('Bankdrücken', { rir: null, sets }))])).kind, 'hold');
});

test('a low explicit set RIR cannot be overridden by an easier overall rating', () => {
  const sets = [2, 2, 0].map(rir => ({ kg: 50, reps: 10, done: true, rir }));
  assert.equal(training.recommend(request([log(performance('Bankdrücken', { rir: 3, sets }))])).kind, 'hold');
});

test('unfinished or below-target work and mixed loads hold', () => {
  const cases = [
    { sets: [{ kg: 50, reps: 10, done: true }, { kg: 50, reps: 10, done: true }] },
    { sets: [10, 10, 9].map(reps => ({ kg: 50, reps, done: true })) },
    { sets: [50, 50, 52.5].map(kg => ({ kg, reps: 10, done: true })) },
    { prescribedSets: 4 },
    { prescribedSets: undefined },
    { rir: 1 }
  ];
  for (const changes of cases) assert.equal(training.recommend(request([log(performance('Bankdrücken', changes))])).kind, 'hold');
});

test('a newer partial performance prevents falling back to an older successful workout', () => {
  const old = log();
  const recent = log(performance('Bankdrücken', { sets: [{ kg: 50, reps: 7, done: true }] }), { date: '2026-11-25' });
  assert.equal(training.recommend(request([old, recent])).kind, 'hold');
  assert.equal(training.getLastPerformance([old, recent], request([])).entry, recent);
});

test('malformed confirmed values block progression instead of being silently discarded', () => {
  for (const bad of [{ kg: null, reps: 10 }, { kg: '', reps: 10 }, { kg: -5, reps: 10 }, { kg: 50, reps: 0 }, { kg: 50, reps: 8.5 }, { kg: 50, reps: 10, unit: 'seconds' }]) {
    const sets = [{ kg: 50, reps: 10, done: true }, { kg: 50, reps: 10, done: true }, Object.assign({ done: true }, bad)];
    const result = training.recommend(request([log(performance('Bankdrücken', { sets }))]));
    assert.equal(result.kind, 'hold');
  }
});

test('assistance progresses downward, clamps at zero, and does not become fictitious added load', () => {
  const assisted = performance('Assisted Pull-up', { sets: Array.from({ length: 3 }, () => ({ kg: 20, reps: 10, done: true })) });
  const options = request([log(assisted)], { exerciseId: assisted.id, step: 5 });
  assert.equal(training.recommend(options).weight, 15);
  assert.equal(training.recommend(options).kind, 'increase');
  assisted.sets.forEach(set => { set.kg = 2; });
  assert.equal(training.recommend(options).weight, 0);
  assisted.sets.forEach(set => { set.kg = 0; });
  assert.equal(training.recommend(options).kind, 'hold');
  assert.equal(training.recommend(options).weight, 0);
});

test('bodyweight sets never produce a kilogram target even if legacy input contains body mass', () => {
  const pullup = performance('Klimmzüge strikt', { sets: Array.from({ length: 3 }, () => ({ kg: 85, reps: 10, done: true })) });
  const options = request([log(pullup)], { exerciseId: pullup.id });
  assert.equal(training.recommend(options).weight, null);
  assert.equal(training.getLastPerformance(options.logs, options).sets[0].kg, null);
  const benchOptions = request([log(pullup)]);
  assert.equal(training.recommend(benchOptions).weight, null);
});

test('added weight uses only the logged added load and does not import strict pull-up data', () => {
  const weighted = performance('Weighted Pull-up', { sets: Array.from({ length: 3 }, () => ({ kg: 5, reps: 10, done: true })) });
  assert.equal(training.recommend(request([log(weighted)], { exerciseId: weighted.id })).weight, 7.5);
  const strict = log(performance('Klimmzüge strikt'));
  assert.equal(training.recommend(request([strict], { exerciseId: weighted.id })).kind, 'new');
});

test('time-based exercises retain seconds and never calculate fictitious kilogram increases', () => {
  for (const name of ['Plank', 'Weighted Plank']) {
    const plank = performance(name, { sets: Array.from({ length: 3 }, () => ({ kg: 5, seconds: 45, done: true })) });
    const options = request([log(plank)], { exerciseId: plank.id, min: 20, max: 45 });
    assert.equal(training.getLastPerformance(options.logs, options).sets[0].seconds, 45);
    assert.equal(training.recommend(options).weight, null);
    assert.equal(training.recommend(options).kind, 'hold');
  }
});

test('weeks 4, 8, 12 and 16 do not increase weights; other weeks have no calendar factor', () => {
  for (const week of [4, 8, 12, 16]) {
    const answer = training.recommend(request([log()], { week }));
    assert.equal(answer.kind, 'deload');
    assert.equal(answer.weight, 50);
  }
  assert.equal(training.recommend(request([log()], { week: 15 })).weight, 52.5);
});

test('API does not mutate histories or expose mutable program metadata', () => {
  const logs = [log()];
  const original = JSON.stringify(logs);
  training.recommend(request(logs));
  const last = training.getLastPerformance(logs, request(logs));
  last.sets[0].kg = 999;
  assert.equal(JSON.stringify(logs), original);
  const meta = training.exercise('Bankdrücken');
  meta.defaultRange.max = 999;
  assert.equal(training.exercise('Bankdrücken').defaultRange.max, 10);
  const alternatives = training.alternatives('Bankdrücken');
  alternatives.push('Invented');
  assert.equal(training.alternatives('Bankdrücken').includes('Invented'), false);
});
