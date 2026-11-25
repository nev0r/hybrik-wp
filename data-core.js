/* Hybrid/Wk data contracts. No DOM, storage, or network side effects. */
(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.HybridData = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = 4;
  const FORMAT = "hybridwk-backup";
  const UNSAFE = new Set(["__proto__", "prototype", "constructor"]);
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const record = value => value !== null && typeof value === "object" && !Array.isArray(value) && Object.prototype.toString.call(value) === "[object Object]";
  const finite = value => typeof value === "number" && Number.isFinite(value);
  const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
  const unset = value => value === null || value === "" || value === undefined;
  const number = (value, min = 0, max = Number.MAX_SAFE_INTEGER) => finite(value) && value >= min && value <= max;
  const text = value => typeof value === "string";
  const fail = path => { throw new Error("Ungültiges Datenfeld: " + path); };

  function copy(value) {
    const seen = new Set();
    let nodes = 0;
    function visit(item, path, depth) {
      if (++nodes > 300000 || depth > 80) fail(path + " (zu umfangreich)");
      if (item === null || typeof item === "string" || typeof item === "boolean") return item;
      if (finite(item)) return item;
      if (item === undefined) return undefined;
      if (typeof item !== "object" || (!Array.isArray(item) && !record(item))) fail(path);
      if (seen.has(item)) fail(path + " (zyklischer Verweis)");
      seen.add(item);
      let result;
      if (Array.isArray(item)) result = item.map((entry, index) => {
        const next = visit(entry, path + "[" + index + "]", depth + 1);
        return next === undefined ? null : next;
      });
      else {
        result = {};
        for (const key of Object.keys(item)) {
          if (UNSAFE.has(key)) fail(path + "." + key);
          const next = visit(item[key], path + "." + key, depth + 1);
          if (next !== undefined) result[key] = next;
        }
      }
      seen.delete(item);
      return result;
    }
    return visit(value, "state", 0);
  }

  function calendar(value) {
    if (!text(value) || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    if (year < 1900 || year > 2300 || month < 1 || month > 12 || day < 1) return false;
    return day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
  }

  function optional(value, key, check, path, nullable = false) {
    if (!own(value, key) || value[key] === undefined || (nullable && value[key] === null)) return;
    if (!check(value[key])) fail(path + "." + key);
  }

  function fields(value, names, check, path, nullable = false) {
    names.forEach(name => optional(value, name, check, path, nullable));
  }

  function array(value, path, check) {
    if (!Array.isArray(value)) fail(path);
    value.forEach((item, index) => check(item, path + "[" + index + "]"));
  }

  function map(value, path, check) {
    if (!record(value)) fail(path);
    Object.entries(value).forEach(([key, item]) => check(item, path + "." + key, key));
  }

  function actualSet(value, path) {
    if (!record(value)) fail(path);
    fields(value, ["kg", "weight"], n => unset(n) || number(n, 0, 10000), path);
    fields(value, ["reps", "seconds"], n => unset(n) || integer(n, 0, 86400), path);
    fields(value, ["rir", "rpe"], n => number(n, 0, 10), path, true);
    fields(value, ["done", "confirmed", "assumed"], n => typeof n === "boolean", path, true);
    fields(value, ["unit"], n => ["reps", "seconds"].includes(n), path);
  }

  function exerciseResult(value, path) {
    if (!record(value)) fail(path);
    fields(value, ["id", "exerciseId", "origin", "exercise", "summary", "studio", "contextId", "deviceId", "equipmentId", "unit"], text, path);
    fields(value, ["rpe", "rir"], n => number(n, 0, 10), path, true);
    fields(value, ["doneCount", "expected", "prescribedSets"], n => integer(n, 0, 1000), path);
    if (own(value, "sets")) array(value.sets, path + ".sets", actualSet);
  }

  function logRecord(value, path, version) {
    if (!record(value) || !text(value.type) || !value.type.trim() || !calendar(value.date)) fail(path);
    if (version === VERSION && (!text(value.id) || !value.id.trim())) fail(path + ".id");
    fields(value, ["id", "name", "key", "studio", "contextId", "deviceId", "equipmentId", "wodId", "effort", "result", "note"], text, path);
    optional(value, "status", n => ["partial", "completed"].includes(n), path);
    optional(value, "legacy", n => typeof n === "boolean", path, true);
    fields(value, ["duration", "distance", "pace", "load", "volume", "elapsed"], n => number(n), path);
    fields(value, ["week"], n => integer(n, 1, 16), path);
    fields(value, ["cycle"], n => integer(n, 1, 100000), path);
    fields(value, ["day"], n => integer(n, 0, 6), path);
    fields(value, ["rpe", "rpeTarget", "rir"], n => number(n, 0, 10), path, true);
    if (value.readiness != null) readinessEntry(value.readiness, path + ".readiness");
    if (own(value, "exerciseResults")) array(value.exerciseResults, path + ".exerciseResults", exerciseResult);
    if (own(value, "prs")) array(value.prs, path + ".prs", (entry, p) => {
      if (!record(entry)) fail(p);
      fields(entry, ["exercise", "exerciseId", "studio", "contextId", "deviceId", "equipmentId"], text, p);
      fields(entry, ["estimated1RM", "kg", "reps"], n => number(n), p);
    });
  }

  function strengthSession(value, path, version) {
    if (value === null) return;
    if (!record(value)) fail(path);
    if (version === VERSION && (!text(value.id) || !value.id.trim())) fail(path + ".id");
    fields(value, ["id", "key", "name", "studio", "contextId", "equipmentId"], text, path);
    optional(value, "date", calendar, path);
    fields(value, ["day"], n => integer(n, 0, 6), path);
    fields(value, ["week"], n => integer(n, 1, 16), path);
    fields(value, ["cycle"], n => integer(n, 1, 100000), path);
    fields(value, ["started", "startedAt", "pausedAt", "lastActiveAt", "elapsed", "activeMs", "segmentStart", "restEnd"], n => number(n), path, true);
    fields(value, ["paused", "legacy"], n => typeof n === "boolean", path, true);
    if (value.readiness != null) readinessEntry(value.readiness, path + ".readiness");
    if (!Array.isArray(value.items) || !value.items.length) fail(path + ".items");
    optional(value, "idx", n => integer(n, 0, value.items.length - 1), path);
    value.items.forEach((item, index) => {
      const p = path + ".items[" + index + "]";
      if (!record(item) || !text(item.exercise) || !item.exercise.trim()) fail(p);
      fields(item, ["origin", "muscle", "id", "exerciseId", "studio", "contextId", "deviceId", "equipmentId", "unit", "weightMode"], text, p);
      fields(item, ["min", "max", "rest"], n => number(n), p);
      fields(item, ["rpe", "rir"], n => number(n, 0, 10), p, true);
      if (!Array.isArray(item.sets) || !item.sets.length) fail(p + ".sets");
      item.sets.forEach((set, i) => actualSet(set, p + ".sets[" + i + "]"));
    });
  }

  function triItem(value, path) {
    if (!record(value)) fail(path);
    fields(value, ["name", "muscle", "exerciseId", "unit"], text, path);
    fields(value, ["reps", "round"], n => integer(n, 0, 1000), path);
    optional(value, "actualReps", n => unset(n) || integer(n, 0, 1000), path);
    optional(value, "kg", n => unset(n) || number(n, 0, 10000), path);
    optional(value, "done", n => typeof n === "boolean", path);
  }

  function triState(value, path) {
    if (!record(value)) fail(path);
    fields(value, ["streak"], n => integer(n, 0, 100000), path);
    fields(value, ["lastWeek", "pausedWeek"], n => integer(n, 1, 16), path, true);
    optional(value, "lastMuscle", text, path, true);
    if (own(value, "sessions")) array(value.sessions, path + ".sessions", (item, p) => {
      if (!record(item) || !calendar(item.date)) fail(p);
      fields(item, ["logId", "contextId"], text, p);
      optional(item, "week", n => integer(n, 1, 16), p);
      optional(item, "setCount", n => integer(n, 0, 1000), p);
      if (own(item, "items")) array(item.items, p + ".items", triItem);
    });
    if (value.active != null) {
      const item = value.active, p = path + ".active";
      if (!record(item) || !Array.isArray(item.items) || !item.items.length) fail(p);
      fields(item, ["group", "id", "logId", "contextId"], text, p);
      fields(item, ["started", "elapsed"], n => number(n), p);
      optional(item, "idx", n => integer(n, 0, item.items.length - 1), p);
      item.items.forEach((entry, i) => triItem(entry, p + ".items[" + i + "]"));
    }
  }

  function wodState(value, path) {
    if (value === null) return;
    if (!record(value) || !["AMRAP", "EMOM", "ForTime"].includes(value.format) || !number(value.min, 0.1, 600)) fail(path);
    if (!Array.isArray(value.moves) || !value.moves.length || !value.moves.every(text)) fail(path + ".moves");
    fields(value, ["kind", "key", "id", "name", "scheme", "sessionId", "logId", "contextId"], text, path);
    fields(value, ["day"], n => integer(n, 0, 6), path);
    fields(value, ["week"], n => integer(n, 1, 16), path);
    fields(value, ["cycle"], n => integer(n, 1, 100000), path);
    fields(value, ["started", "pausedAt", "stopped"], n => number(n), path, true);
    fields(value, ["paused", "rounds"], n => number(n), path);
    fields(value, ["ended", "manual", "capped"], n => typeof n === "boolean", path);
    optional(value, "rpe", n => number(n, 0, 10), path, true);
  }

  function readinessEntry(value, path) {
    if (!record(value)) fail(path);
    Object.entries(value).forEach(([key, item]) => { if (item !== null && !number(item, 0, 10)) fail(path + "." + key); });
  }

  function checkState(state, version) {
    if (!record(state) || !integer(state.week, 1, 16) || !record(state.weights) || !Array.isArray(state.logs)) fail("state (Woche, Arbeitsgewichte und Verlauf erforderlich)");
    optional(state, "cycle", n => integer(n, 1, 100000), "state");
    optional(state, "schemaVersion", n => integer(n, 1, VERSION), "state");
    fields(state, ["pace"], n => text(n) && /^\d{1,2}:[0-5]\d$/.test(n) && n !== "0:00" && n !== "00:00", "state");
    fields(state, ["pause", "bodyweight"], n => number(n), "state");
    fields(state, ["lighter", "creatine", "caffeine"], n => typeof n === "boolean", "state", true);
    optional(state, "selectedDay", n => integer(n, 0, 6), "state", true);
    optional(state, "tab", n => ["programm", "training", "verlauf", "analyse", "setup"].includes(n), "state");
    optional(state, "contextId", text, "state");
    optional(state, "lighterDate", n => unset(n) || calendar(n), "state");
    for (const field of ["contexts", "deviceSelections"]) if (own(state, field)) map(state[field], field, (item, p) => { if (!text(item)) fail(p); });
    if (own(state, "exerciseSteps")) map(state.exerciseSteps, "exerciseSteps", (item, p) => { if (!number(item, 0, 10000)) fail(p); });
    if (own(state, "extras")) map(state.extras, "extras", (item, p) => { if (!["none", "finisher", "tri"].includes(item)) fail(p); });
    if (own(state, "runTargets")) map(state.runTargets, "runTargets", (item, p) => { if (!number(item, 0, 1000)) fail(p); });
    map(state.weights, "weights", (n, p) => { if (!unset(n) && !number(n, 0, 10000)) fail(p); });
    const ids = new Set();
    state.logs.forEach((entry, index) => {
      logRecord(entry, "logs[" + index + "]", version);
      if (version === VERSION) { if (ids.has(entry.id)) fail("logs (doppelte Eintragskennung)"); ids.add(entry.id); }
    });
    if (own(state, "session")) strengthSession(state.session, "session", version);
    if (own(state, "tri")) triState(state.tri, "tri");
    if (own(state, "wodRun")) wodState(state.wodRun, "wodRun");
    if (own(state, "wods")) array(state.wods, "wods", (item, p) => { if (!record(item)) fail(p); });
    if (own(state, "importedCsv") && !Array.isArray(state.importedCsv)) fail("importedCsv");
    if (own(state, "restDays")) array(state.restDays, "restDays", (item, p) => { if (!calendar(item)) fail(p); });
    if (own(state, "sleep")) array(state.sleep, "sleep", (item, p) => {
      if (!record(item) || !calendar(item.date) || !number(item.hours, 0, 24)) fail(p);
    });
    if (own(state, "measurements")) array(state.measurements, "measurements", (item, p) => {
      if (!record(item) || !calendar(item.date)) fail(p);
      fields(item, ["waist", "shoulder", "weight"], n => unset(n) || number(n, 0, 1000), p);
    });
    if (own(state, "routine")) map(state.routine, "routine", (item, p, key) => {
      if (!calendar(key) || !Array.isArray(item) || !item.every(n => integer(n, 0, 1000))) fail(p);
    });
    for (const field of ["meals", "rehab"]) if (own(state, field)) map(state[field], field, (item, p, key) => { if (!calendar(key)) fail(p); map(item, p, (flag, fp) => {
      if (flag !== null && typeof flag !== "boolean") fail(fp);
    }); });
    for (const field of ["completed"]) if (own(state, field)) map(state[field], field, (flag, p) => {
      if (flag !== null && typeof flag !== "boolean") fail(p);
    });
    if (own(state, "dayOrder")) map(state.dayOrder, "dayOrder", (item, p, key) => {
      if (!/^([1-9]|1[0-6])$/.test(key) || !Array.isArray(item) || item.length !== 7 || new Set(item).size !== 7 || !item.every(n => integer(n, 0, 6))) fail(p);
    });
    if (own(state, "dayMode")) map(state.dayMode, "dayMode", (item, p) => {
      if (item !== null && !["kraft", "crossfit"].includes(item)) fail(p);
    });
    if (own(state, "wodPick")) map(state.wodPick, "wodPick", (item, p) => { if (!integer(item, 0, 100000)) fail(p); });
    if (own(state, "swaps")) map(state.swaps, "swaps", (item, p) => { if (item !== null && !text(item)) fail(p); });
    if (own(state, "readiness")) map(state.readiness, "readiness", (item, p, key) => {
      if (!calendar(key)) fail(p);
      if (item === null) return;
      readinessEntry(item, p);
    });
    if (own(state, "loadFactors")) map(state.loadFactors, "loadFactors", (item, p) => { if (!number(item, 0, 100)) fail(p); });
    if (own(state, "tests")) map(state.tests, "tests", (item, p) => {
      if (!record(item)) fail(p);
      optional(item, "date", calendar, p);
      for (const key of ["0", "1", "2", "3"]) optional(item, key, n => unset(n) || number(n, 0, 10000), p);
    });
    if (state.pendingSuggestion != null) {
      if (!record(state.pendingSuggestion)) fail("pendingSuggestion");
      fields(state.pendingSuggestion, ["key", "reason", "exerciseId", "contextKey"], text, "pendingSuggestion");
      fields(state.pendingSuggestion, ["delta"], n => number(n, -10000, 10000), "pendingSuggestion");
    }
    if (state.restTimer != null) {
      if (!record(state.restTimer)) fail("restTimer");
      fields(state.restTimer, ["endAt", "total", "remaining"], n => number(n), "restTimer");
    }
  }

  function validateBackup(input) {
    try {
      let value = typeof input === "string" ? JSON.parse(input) : input;
      value = copy(value);
      if (!record(value)) fail("Backup");
      let state = value;
      if (own(value, "format") && own(value, "state")) {
        if (value.format !== FORMAT || value.version !== VERSION || !record(value.state)) fail("Backup-Format oder Version");
        state = value.state;
        if (state.schemaVersion !== VERSION) fail("Backup-Version");
      }
      const version = own(state, "schemaVersion") ? state.schemaVersion : 3;
      if (!integer(version, 1, VERSION)) fail("schemaVersion (nicht unterstützte Version)");
      checkState(state, version);
      return {ok: true, state, version};
    } catch (error) {
      return {ok: false, error: error && error.message ? error.message : "Ungültiges Backup"};
    }
  }

  function merge(defaults, source) {
    const result = copy(defaults || {});
    Object.entries(source || {}).forEach(([key, value]) => {
      if (record(value) && record(result[key])) result[key] = merge(result[key], value);
      else result[key] = copy(value);
    });
    return result;
  }

  function hash(value) {
    let result = 2166136261;
    for (let i = 0; i < value.length; i++) { result ^= value.charCodeAt(i); result = Math.imul(result, 16777619); }
    return (result >>> 0).toString(36);
  }

  function uid(prefix = "entry") {
    const clean = String(prefix || "entry").replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 32);
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return clean + "-" + crypto.randomUUID();
    return clean + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12);
  }

  function migrateState(raw, base) {
    let source = raw == null ? {} : (typeof raw === "string" ? JSON.parse(raw) : raw);
    if (record(source) && source.format === FORMAT && own(source, "state")) source = source.state;
    source = copy(source);
    if (!record(source)) fail("state");
    if (own(source, "schemaVersion") && !integer(source.schemaVersion, 1, VERSION)) fail("schemaVersion (nicht unterstützte Version)");
    const legacy = source.schemaVersion !== VERSION;
    const state = merge(base || {}, source);
    state.schemaVersion = VERSION;
    if (!own(state, "week")) state.week = 1;
    if (!own(state, "cycle")) state.cycle = 1;
    if (!own(state, "weights")) state.weights = {};
    for (const field of ["logs", "sleep", "measurements", "wods", "restDays", "importedCsv"]) if (!own(state, field)) state[field] = [];
    for (const field of ["routine", "meals", "rehab", "swaps", "completed", "dayOrder", "tests", "readiness", "dayMode", "wodPick"]) if (!own(state, field)) state[field] = {};
    if (!own(state, "tri")) state.tri = {sessions: []};
    if (record(state.tri) && !own(state.tri, "sessions")) state.tri.sessions = [];
    if (!own(state, "session")) state.session = null;
    if (!own(state, "wodRun")) state.wodRun = null;
    if (!Array.isArray(state.logs)) fail("logs");
    const used = new Set();
    state.logs.forEach((log, index) => {
      if (!record(log)) fail("logs[" + index + "]");
      let id = text(log.id) && log.id.trim() && !used.has(log.id) ? log.id : "legacy-" + hash(JSON.stringify(log)) + "-" + index;
      while (used.has(id)) id += "-next";
      log.id = id; used.add(id);
      if (legacy) log.legacy = true;
    });
    if (state.session != null) {
      if (!record(state.session)) fail("session");
      if (!text(state.session.id) || !state.session.id.trim()) state.session.id = "session-" + hash(JSON.stringify(state.session));
      if (legacy) state.session.legacy = true;
      if (!own(state.session, "week")) state.session.week = state.week;
      if (!own(state.session, "cycle")) state.session.cycle = state.cycle;
      if (!own(state.session, "idx")) state.session.idx = 0;
    }
    // RPE from an old prefilled form is retained as history, never recast as RIR.
    checkState(state, VERSION);
    return state;
  }

  function upsertLog(logs, log) {
    if (!Array.isArray(logs) || !record(log) || !text(log.id) || !log.id.trim()) fail("upsertLog (Eintragskennung erforderlich)");
    const result = copy(logs), next = copy(log), index = result.findIndex(entry => entry && entry.id === next.id);
    if (index < 0) result.push(next);
    else result[index] = next;
    return result;
  }

  function isDuplicate(a, b) {
    if (!record(a) || !record(b) || a.type !== b.type || a.date !== b.date) return false;
    if (Math.round((a.duration || 0) * 60) !== Math.round((b.duration || 0) * 60) || Math.abs((a.distance || 0) - (b.distance || 0)) >= 0.02) return false;
    // Record IDs identify updates (upsertLog); these fields identify the activity.
    for (const key of ["key", "wodId", "studio", "contextId", "deviceId", "equipmentId", "externalId", "providerId", "activityId", "sourceId"]) {
      if (!unset(a[key]) && !unset(b[key]) && String(a[key]) !== String(b[key])) return false;
    }
    const label = value => String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
    const generic = new Set(["", "nachgetragen", "csv-import", "training", "lauf", "run", "strength", "other"]);
    const an = label(a.name), bn = label(b.name);
    if (!generic.has(an) && !generic.has(bn) && an !== bn) return false;
    if (Array.isArray(a.exerciseResults) && Array.isArray(b.exerciseResults) && a.exerciseResults.length && b.exerciseResults.length) {
      const movements = rows => rows.map(row => row.exerciseId || row.exercise || row.origin || "").join("|");
      if (movements(a.exerciseResults) !== movements(b.exerciseResults)) return false;
    }
    return true;
  }

  return {VERSION, FORMAT, uid, migrateState, validateBackup, upsertLog, isDuplicate};
});
