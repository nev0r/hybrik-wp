"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const Data = require("../data-core.js");

const clone = value => JSON.parse(JSON.stringify(value));
const DAY = "2026-11-25";
const base = () => ({
  week: 1, tab: "programm", weights: {bench: null, squat: null},
  pace: "6:30", pause: 120, bodyweight: 0,
  logs: [], session: null, tri: {sessions: []}, wodRun: null,
  contextId: "main", contexts: {main: "Mein Studio"}, deviceSelections: {},
  exerciseSteps: {}, extras: {}, runTargets: {easy: 0, quality: 0, long: 0}, lighterDate: ""
});

function legacy() {
  return {
    week: 13, tab: "training", weights: {bench: 72.5, custom: 17.5},
    pace: "5:30", pause: 90, bodyweight: 81,
    logs: [
      {type: "strength", date: DAY, name: "Push + Easy Run", key: "push", week: 13, day: 1,
        duration: 45, load: 31.5, volume: 1800, rpeTarget: 8.5, readiness: {sleep: 3},
        exerciseResults: [{origin: "Bankdrücken", exercise: "Brustpresse", summary: "50×8, 50×8", rpe: 8, doneCount: 2, expected: 3}],
        prs: [{exercise: "Brustpresse", estimated1RM: 63.3}]},
      {type: "run", date: DAY, name: "Easy Run", duration: 30, distance: 5.5, pace: 327, load: 15}
    ],
    session: {day: 1, key: "push", name: "Push + Easy Run", started: 1795600000000, idx: 0,
      readiness: null, items: [{origin: "Bankdrücken", exercise: "Brustpresse", muscle: "Brust", rpe: 8,
        sets: [{kg: 50, reps: 8, done: true}, {kg: 50, reps: 8, done: false}]}]},
    routine: {[DAY]: [0, 2, 4]}, meals: {[DAY]: {0: true, 1: false}}, rehab: {[DAY]: {hips: true}},
    sleep: [{date: DAY, hours: 7.25}], measurements: [{date: DAY, waist: 83.5, shoulder: 115}],
    wods: [{name: "Eigenes WOD", moves: ["Rudern"]}], swaps: {Bankdrücken: "Brustpresse"},
    completed: {"13-1": true}, restDays: ["2026-11-22"], dayOrder: {13: [1, 0, 2, 3, 5, 4, 6]},
    tri: {sessions: [{date: DAY, week: 13, muscle: "back", setCount: 1,
      items: [{name: "Rudern", reps: 6, kg: 40, done: true}]}], streak: 2, lastWeek: 12,
      lastMuscle: "back", pausedWeek: null,
      active: {group: "shoulders", idx: 0, started: 1795600000000,
        items: [{name: "Seitheben", reps: 12, muscle: "Schulter", round: 1, kg: 5, done: false}]}},
    tests: {start: {0: 62.5, 1: 85, 2: 42, 3: 30, date: "2026-09-01"}},
    readiness: {[DAY]: {sleep: 3, legs: 2, energy: 3}}, lighter: false, selectedDay: 1,
    loadFactors: {light: .5, normal: .7, hard: .9}, importedCsv: ["import-1"],
    dayMode: {"13-1": "kraft"}, wodPick: {"finisher-13-1": 2},
    wodRun: {kind: "finisher", day: 1, week: 13, key: "push", id: "wod-upper-1", name: "Upper Flow",
      format: "AMRAP", min: 8, moves: ["Rudern", "Push-ups"], scheme: "6 / 8", legs: 0,
      started: 1795600000000, pausedAt: null, paused: 0, rounds: 2, stopped: null,
      ended: false, manual: false, capped: false, rpe: 7},
    pendingSuggestion: {key: "bench", delta: 2.5, reason: "Ziel erreicht"},
    custom: {nested: ["Erhalten", {flag: true}]}
  };
}

test("v3 migration preserves the full rich state and actual current week without mutating either input", () => {
  const old = legacy(), defaults = base(), oldCopy = clone(old), baseCopy = clone(defaults);
  const next = Data.migrateState(old, defaults);
  assert.equal(next.schemaVersion, 4);
  assert.equal(next.cycle, 1);
  assert.equal(next.week, 13);
  assert.equal(next.weights.bench, 72.5);
  assert.equal(next.weights.squat, null);
  assert.equal(next.weights.custom, 17.5);
  for (const key of ["routine", "meals", "rehab", "sleep", "measurements", "wods", "swaps", "completed",
    "restDays", "dayOrder", "tri", "tests", "readiness", "loadFactors", "importedCsv", "dayMode", "wodPick", "wodRun", "pendingSuggestion", "custom"]) {
    assert.deepEqual(next[key], old[key], key);
  }
  next.custom.nested[1].flag = false;
  next.logs[0].exerciseResults[0].summary = "changed";
  assert.deepEqual(old, oldCopy);
  assert.deepEqual(defaults, baseCopy);
});

test("legacy records keep their original evidence and receive deterministic distinct IDs", () => {
  const old = legacy();
  old.logs.push(clone(old.logs[0]));
  old.logs[0].id = "existing-id";
  old.logs[1].id = "existing-id";
  const a = Data.migrateState(old, base()), b = Data.migrateState(clone(old), base());
  assert.deepEqual(a.logs.map(x => x.id), b.logs.map(x => x.id));
  assert.equal(a.logs[0].id, "existing-id");
  assert.equal(new Set(a.logs.map(x => x.id)).size, 3);
  a.logs.forEach((log, i) => {
    assert.equal(log.legacy, true);
    const expected = {...old.logs[i], id: log.id, legacy: true};
    assert.deepEqual(log, expected);
  });
  assert.deepEqual(Data.migrateState(a, base()), a);
});

test("an in-progress legacy session resumes as a preserved snapshot without invented RIR", () => {
  const old = legacy(), next = Data.migrateState(old, base());
  assert.equal(next.session.legacy, true);
  assert.equal(next.session.week, 13);
  assert.equal(next.session.cycle, 1);
  assert.equal(next.session.id, Data.migrateState(legacy(), base()).session.id);
  assert.deepEqual(next.session.items, old.session.items);
  assert.equal(next.session.items[0].rpe, 8);
  assert.equal(Object.hasOwn(next.session.items[0], "rir"), false);
  assert.equal(Object.hasOwn(next.logs[0].exerciseResults[0], "rir"), false);
  assert.equal(next.wodRun.id, "wod-upper-1", "WOD template identity must be preserved");
});

test("fresh migration has no fabricated working weights or training history", () => {
  const fresh = Data.migrateState(null, base());
  assert.deepEqual(fresh.weights, {bench: null, squat: null});
  assert.deepEqual(fresh.logs, []);
  assert.equal(fresh.session, null);
  assert.equal(fresh.week, 1);
  assert.equal(Data.validateBackup(fresh).ok, true);
});

test("both ends of the 16-week plan and an existing cycle are retained", () => {
  for (const week of [1, 16]) {
    const next = Data.migrateState({week, cycle: 3, weights: {}, logs: []}, base());
    assert.equal(next.week, week);
    assert.equal(next.cycle, 3);
  }
});

test("legacy raw backups and v4 wrapped backups validate and preserve unknown serializable fields", () => {
  const old = legacy();
  const checked = Data.validateBackup(JSON.stringify(old));
  assert.equal(checked.ok, true);
  assert.equal(checked.version, 3);
  assert.deepEqual(checked.state, old);
  const state = Data.migrateState(old, base());
  const imported = Data.validateBackup({format: Data.FORMAT, version: 4, state, exportedAt: "2026-11-25"});
  assert.equal(imported.ok, true);
  assert.equal(imported.version, 4);
  assert.deepEqual(imported.state, state);
  imported.state.custom.nested[1].flag = false;
  assert.equal(state.custom.nested[1].flag, true);
});

test("new v4 exercise, equipment, rest timer, actual repetitions, and paused session shapes validate", () => {
  const state = Data.migrateState(null, base());
  Object.assign(state, {
    contextId: "reed", contexts: {main: "Studio", reed: "John Reed"},
    deviceSelections: {"reed|press": "machine-a"}, exerciseSteps: {"reed|press|machine-a": 2.5},
    extras: {"1-1": "tri"}, runTargets: {easy: 5, quality: 4, long: 8}, lighterDate: DAY,
    session: {id: "session-a", week: 1, cycle: 1, day: 1, key: "push", name: "Push", date: DAY,
      contextId: "reed", activeMs: 123456, segmentStart: null, paused: true, restEnd: null, idx: 0,
      items: [{id: "press", exercise: "Brustpresse", origin: "Bankdrücken", muscle: "Brust", unit: "reps",
        weightMode: "load", deviceId: "machine-a", min: 8, max: 12, rest: 120, rir: null,
        sets: [{kg: null, reps: null, seconds: null, done: false}]}]},
    tri: {sessions: [], active: {group: "back", logId: "tri-a", idx: 0, started: 123456,
      items: [{name: "Rudern", reps: 6, actualReps: null, kg: null, done: false}]}},
    logs: [{id: "log-a", type: "strength", date: DAY, duration: 20, status: "partial", contextId: "reed",
      exerciseResults: [{exercise: "Brustpresse", contextId: "reed", deviceId: "machine-a", rir: 2,
        sets: [{kg: 30, reps: 10, seconds: null, done: true}]}]}]
  });
  assert.equal(Data.validateBackup(state).ok, true);
  assert.deepEqual(Data.migrateState(state, base()), state);
  assert.equal(Object.hasOwn(state.logs[0], "legacy"), false);
});

test("genuine nullable legacy fields and false flags are accepted", () => {
  const old = legacy();
  Object.assign(old, {selectedDay: null, session: null, wodRun: null, pendingSuggestion: null,
    lighter: null, creatine: null, caffeine: false, completed: {"13-0": null},
    meals: {[DAY]: {0: null, 1: false}}, rehab: {[DAY]: {hips: null}}});
  old.tri.active = null;
  old.readiness[DAY].legs = null;
  const checked = Data.validateBackup(old);
  assert.equal(checked.ok, true, checked.error);
  assert.equal(Data.validateBackup(Data.migrateState(old, base())).ok, true);
});

test("invalid envelopes, missing required state, and unsupported versions fail before migration", () => {
  for (const input of ["{broken", null, [], {}, {logs: []},
    {week: 17, weights: {}, logs: []}, {week: 0, weights: {}, logs: []},
    {week: 1, weights: {}, logs: [], schemaVersion: 5},
    {format: "another-app", version: 4, state: legacy()},
    {format: Data.FORMAT, version: 5, state: legacy()},
    {format: Data.FORMAT, version: 4, state: legacy()}]) {
    const result = Data.validateBackup(input);
    assert.equal(result.ok, false, JSON.stringify(input));
    assert.equal(typeof result.error, "string");
  }
});

test("corrupt nested structures and out-of-range runtime values are rejected", () => {
  const corruptions = [
    s => { s.logs = [null]; },
    s => { s.logs[0].duration = -1; },
    s => { s.logs[0].distance = Infinity; },
    s => { s.logs[0].exerciseResults = [null]; },
    s => { s.logs[0].exerciseResults[0].sets = {0: {kg: 10}}; },
    s => { s.logs[0].prs = ["not an object"]; },
    s => { s.logs[0].readiness = "bad"; },
    s => { s.session.items = null; },
    s => { s.session.items[0].sets = []; },
    s => { s.session.items[0].sets[0].reps = -3; },
    s => { s.session.items[0].sets[0].done = "yes"; },
    s => { s.session.idx = 20; },
    s => { s.tri.active.items = [null]; },
    s => { s.tri.sessions = {}; },
    s => { s.wodRun.moves = [12]; },
    s => { s.wodRun.paused = -5; },
    s => { s.sleep[0].hours = 25; },
    s => { s.measurements[0].waist = NaN; },
    s => { s.routine[DAY] = {}; },
    s => { s.meals[DAY] = []; },
    s => { s.rehab[DAY].hips = 1; },
    s => { s.completed["13-1"] = {}; },
    s => { s.dayOrder[13] = [0, 0, 1, 2, 3, 4, 5]; },
    s => { s.dayOrder[17] = [0, 1, 2, 3, 4, 5, 6]; },
    s => { s.readiness[DAY].sleep = "3"; },
    s => { s.tests.start = []; },
    s => { s.weights.bench = -10; },
    s => { s.selectedDay = 7; },
    s => { s.contexts = []; },
    s => { s.deviceSelections = {machine: {name: "wrong"}}; },
    s => { s.exerciseSteps = {machine: -2.5}; },
    s => { s.extras = {"13-1": "everything"}; },
    s => { s.runTargets = {easy: -5}; }
  ];
  corruptions.forEach((corrupt, i) => {
    const state = legacy();
    corrupt(state);
    const result = Data.validateBackup(state);
    assert.equal(result.ok, false, "corruption #" + i);
    assert.ok(result.error.length > 0);
  });
});

test("calendar validation rejects impossible dates, including invalid leap days and map keys", () => {
  for (const date of ["2026-02-29", "2024-02-30", "2026-11-31", "2026-00-12", "2026-1-01"]) {
    const state = legacy();
    state.logs[0].date = date;
    assert.equal(Data.validateBackup(state).ok, false, date);
  }
  const leap = legacy();
  leap.logs[0].date = "2024-02-29";
  assert.equal(Data.validateBackup(leap).ok, true);
  const state = legacy();
  state.routine = {"2026-02-31": [0]};
  assert.equal(Data.validateBackup(state).ok, false);
});

test("unsafe prototype keys, cycles, non-finite values, and unserializable values are rejected", () => {
  for (const key of ["__proto__", "constructor", "prototype"]) {
    const data = '{"week":1,"weights":{},"logs":[],"custom":{"' + key + '":{"polluted":true}}}';
    assert.equal(Data.validateBackup(data).ok, false);
  }
  for (const value of [Infinity, NaN, () => {}, Symbol("x"), 1n]) {
    const state = {week: 1, weights: {}, logs: [], custom: value};
    assert.equal(Data.validateBackup(state).ok, false);
  }
  const cyclic = legacy();
  cyclic.custom.self = cyclic;
  assert.equal(Data.validateBackup(cyclic).ok, false);
  assert.equal({}.polluted, undefined);
});

test("v4 backup IDs must be present and unique; legacy validation permits missing IDs", () => {
  assert.equal(Data.validateBackup(legacy()).ok, true);
  const state = Data.migrateState(legacy(), base());
  delete state.logs[0].id;
  assert.equal(Data.validateBackup(state).ok, false);
  state.logs[0].id = state.logs[1].id;
  assert.equal(Data.validateBackup(state).ok, false);
  state.logs[0].id = "different";
  delete state.session.id;
  assert.equal(Data.validateBackup(state).ok, false);
});

test("upsert updates exactly one logical log immutably and is idempotent", () => {
  const logs = [{id: "a", type: "run", date: DAY, duration: 30, nested: {kept: true}}];
  const updated = {...logs[0], duration: 35};
  const once = Data.upsertLog(logs, updated), twice = Data.upsertLog(once, updated);
  assert.equal(once.length, 1);
  assert.equal(once[0].duration, 35);
  assert.deepEqual(twice, once);
  assert.equal(logs[0].duration, 30);
  once[0].nested.kept = false;
  assert.equal(logs[0].nested.kept, true);
  assert.equal(updated.nested.kept, true);
  assert.equal(Data.upsertLog(logs, {id: "b", type: "bike", date: DAY, duration: 30}).length, 2);
  assert.throws(() => Data.upsertLog(logs, {type: "run"}), /Eintragskennung/);
});

test("dedupe never collapses equal-duration strength and cycling sessions", () => {
  const a = {type: "strength", date: DAY, duration: 30, distance: 0};
  assert.equal(Data.isDuplicate(a, {...a, type: "bike"}), false);
  assert.equal(Data.isDuplicate(a, {...a, type: "run"}), false);
  assert.equal(Data.isDuplicate(a, {...a}), true);
});

test("dedupe includes activity, gym, equipment, and exercise identity when available", () => {
  const a = {type: "strength", date: DAY, duration: 30, distance: 0, name: "Push", key: "push",
    contextId: "reed", deviceId: "press-a", exerciseResults: [{exerciseId: "press"}]};
  for (const change of [{key: "pull"}, {contextId: "holmes"}, {deviceId: "press-b"},
    {name: "Pull"}, {exerciseResults: [{exerciseId: "row"}]}]) {
    assert.equal(Data.isDuplicate(a, {...a, ...change}), false, JSON.stringify(change));
  }
  const wod = {type: "crossfit", date: DAY, duration: 8, wodId: "upper-a"};
  assert.equal(Data.isDuplicate(wod, {...wod, wodId: "upper-b"}), false);
  assert.equal(Data.isDuplicate({...a, id: "record-a"}, {...a, id: "record-b"}), true);
});

test("dedupe tolerates generic import labels and rounding while keeping distinct distances/dates", () => {
  const a = {type: "run", date: DAY, duration: 30, distance: 5, name: "Easy Run"};
  assert.equal(Data.isDuplicate(a, {...a, name: "CSV-Import", duration: 30.001, distance: 5.001}), true);
  assert.equal(Data.isDuplicate(a, {...a, distance: 5.1}), false);
  assert.equal(Data.isDuplicate(a, {...a, date: "2026-11-24"}), false);
  assert.equal(Data.isDuplicate(a, {...a, duration: 31}), false);
  assert.equal(Data.isDuplicate(a, {...a, activityId: "1"}), true);
  assert.equal(Data.isDuplicate({...a, activityId: "1"}, {...a, activityId: "2"}), false);
});

test("UMD exposes the same pure browser contract without requiring DOM or storage", () => {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(require.resolve("../data-core.js"), "utf8"), context);
  const api = context.HybridData;
  assert.equal(api.VERSION, 4);
  assert.equal(api.FORMAT, "hybridwk-backup");
  const state = api.migrateState({week: 16, weights: {}, logs: []}, {});
  assert.equal(state.week, 16);
  assert.equal(api.validateBackup(state).ok, true);
  assert.match(api.uid("session"), /^session-/);
  assert.notEqual(api.uid("session"), api.uid("session"));
});
