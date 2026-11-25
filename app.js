'use strict';

const BASE = {
  week: 1,
  tab: 'programm',
  weights: {
    bench: 50,
    legpress: 120,
    deadlift: 100,
    squat: 80,
    ohp: 30
  },
  pace: '6:30',
  pause: 120,
  bodyweight: 0,
  logs: [],
  routine: {},
  meals: {},
  rehab: {},
  sleep: [],
  measurements: [],
  wods: [],
  swaps: {},
  completed: {},
  restDays: [],
  dayOrder: {},
  session: null,
  tri: {
    sessions: []
  },
  tests: {},
  readiness: {},
  lighter: false,
  selectedDay: null,
  loadFactors: {
    light: .5,
    normal: .7,
    hard: .9
  },
  importedCsv: [],
  dayMode: {},
  wodPick: {},
  wodRun: null
};
const W = [{
  factor: [1, 1.03, 1.06, .90],
  main: [4, 6],
  deload: [3, 6],
  aux: 3,
  easy: [5, 5, 5.5, 5],
  long: [7, 8, 9, 7],
  quality: ['5 km Strides', '5 km Tempo (1,5 + 2 + 1,5)', '6 km Tempo (3 km)', '5 km locker'],
  rpe: [7, 7.5, 8, 6]
}, {
  factor: [1.05, 1.07, 1.09, .92],
  main: [5, 5],
  deload: [3, 5],
  aux: 3,
  easy: [5.5, 5.5, 6, 5],
  long: [10, 11, 12, 8],
  quality: ['6 km · 6×400 m', '7 km Tempo (2/3/2)', '7 km · 8×400 m', '5 km locker'],
  rpe: [7.5, 8, 8.5, 6]
}, {
  factor: [1.08, 1.10, 1.12, .93],
  main: [5, 4],
  deload: [3, 4],
  aux: 2,
  easy: [6, 6, 6.5, 5],
  long: [12, 13, 14, 9],
  quality: ['7 km · 5×1000 m', '8 km Tempo (2/4/2)', '8 km · 6×800 m', '5 km locker'],
  rpe: [8, 8.5, 9, 6]
}, {
  factor: [1.10, 1.13, 1.15, .90],
  main: [4, 3],
  deload: [3, 3],
  aux: 2,
  easy: [6.5, 6.5, 6, 5],
  long: [14, 14, 11, 8],
  quality: ['8 km · 4×1200 m', '8 km Tempo (2/5/1)', '7 km · 5×800 m', '5-km-Test'],
  rpe: [8.5, 9, 9, 7]
}];
const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const PLAN = [{
  name: 'Lower A',
  key: 'squat',
  legs: 1
}, {
  name: 'Push + Easy Run',
  key: 'push',
  run: 'easy'
}, {
  name: 'Pull + Quality Run',
  key: 'pull',
  run: 'quality',
  hard: 1
}, {
  name: 'Lower B',
  key: 'deadlift',
  legs: 1
}, {
  name: 'Upper',
  key: 'upper'
}, {
  name: 'Long Run',
  key: 'long',
  run: 'long'
}, {
  name: 'Rehab & Recovery',
  key: 'rehab'
}];
const EX = {
  squat: [['Back Squat', 'squat', 'main', '6'], ['Beinpresse', 'legs', '8–10', '8'], ['Walking Lunges', 'legs', '10/Bein', '8'], ['Seated Leg Curl', 'hamstrings', '10–12', '10'], ['Standing Calf Raise', 'calves', '12–15', '12']],
  push: [['Bankdrücken', 'chest', 'main', '6'], ['Overhead Press', 'shoulders', 'main', '6'], ['Incline DB Press', 'chest', '8–10', '8'], ['Cable Lateral Raise', 'shoulders', '12–15', '12'], ['Rope Triceps Pushdown', 'triceps', '10–12', '10'], ['Overhead Triceps Extension', 'triceps', '10–12', '10']],
  pull: [['Klimmzüge strikt', 'back', 'main', '6'], ['Pendlay Row', 'back', '6–8', '6'], ['Lat Pulldown', 'back', '8–10', '8'], ['Rear Delt Fly', 'shoulders', '12–15', '12'], ['EZ Bar Curl', 'biceps', '8–10', '8'], ['Hammer Curl', 'biceps', '10–12', '10']],
  deadlift: [['Deadlift', 'deadlift', 'main', '6'], ['Romanian Deadlift', 'hamstrings', '8–10', '8'], ['Bulgarian Split Squat', 'legs', '8/Bein', '8'], ['Seated Hamstring Curl', 'hamstrings', '10–12', '10'], ['Cable Crunch', 'core', '12–15', '12']],
  upper: [['Seated DB Shoulder Press', 'shoulders', '8–10', '8'], ['Klimmzüge', 'back', '6–10', '6'], ['Chest-Supported Row', 'back', '8–10', '8'], ['Dips', 'chest', '8–10', '8'], ['Face Pulls', 'shoulders', '15', '15'], ['Hanging Knee Raise', 'core', '10–15', '10']]
};
const ALT = Object.fromEntries(Object.values(window.HybridTraining.PROGRAM).flat().map(slot => [slot.origin, window.HybridTraining.alternatives(slot.origin)]));
const MUSCLE = {
  squat: ['legs', 'hamstrings', 'calves'],
  push: ['chest', 'shoulders', 'triceps'],
  pull: ['back', 'biceps', 'shoulders'],
  deadlift: ['deadlift', 'hamstrings', 'legs', 'core'],
  upper: ['shoulders', 'back', 'chest', 'core']
};
function fresh() {
  return JSON.parse(JSON.stringify(BASE));
}
async function load() {
  let raw = null, source = null, localAvailable = true, providerError = null;
  try {
    persistedJSON = localStorage.getItem(STORAGE_KEY);
    raw = persistedJSON; source = raw !== null ? STORAGE_KEY : null;
    if (raw === null) for (const key of ['hybridwk-v3', 'hybridwk']) {
      const found = localStorage.getItem(key);
      if (found !== null) { raw = found; source = key; break; }
    }
  } catch (_) { localAvailable = false; }
  if (raw === null && window.storage && typeof window.storage.get === 'function') {
    for (const key of [STORAGE_KEY, 'hybridwk-v3', 'hybridwk']) {
      let result;
      try { result = await window.storage.get(key); } catch (error) { if (!/not[ -]?found|does not exist|不存在/i.test(String(error?.message || error))) providerError = error; continue; }
      const value = result && Object.prototype.hasOwnProperty.call(result, 'value') ? result.value : result;
      if (value !== null && value !== undefined) {
        raw = typeof value === 'string' ? value : JSON.stringify(value); source = key; break;
      }
    }
  }
  if (raw === null && providerError) throw new Error('Der frühere Datenspeicher ist momentan nicht lesbar. Bitte später erneut laden; es wurde kein neuer Stand angelegt.');
  startupOriginal = raw;
  if (raw !== null) {
    const check = DATA.validateBackup(JSON.parse(raw));
    if (!check.ok) throw new Error(check.error);
    S = DATA.migrateState(check.state, BASE);
  } else S = DATA.migrateState(fresh(), BASE);
  normalizeState(S);
  const checked = DATA.validateBackup(S);
  if (!checked.ok) throw new Error(checked.error);
  hydrated = true;
  if (!localAvailable) {
    storageBlocked = true;
    storageNotice('Der Browserspeicher ist nicht verfügbar. Änderungen bleiben nur in diesem Fenster. Bitte sichere deinen Stand über Setup → Backup.');
    return;
  }
  if (raw !== null && source !== STORAGE_KEY) {
    try {
      if (!localStorage.getItem(STORAGE_KEY + ':before-migration')) localStorage.setItem(STORAGE_KEY + ':before-migration', raw);
      S.migrationNotice = true;
    } catch (_) {
      storageBlocked = true;
      storageNotice('Die alte Version bleibt erhalten. Für die Sicherheitskopie fehlt Speicherplatz; bitte exportiere deinen Stand im Setup.');
      return;
    }
  }
  save();
}
const DATA = window.HybridData;
const TRAIN = window.HybridTraining;
const STORAGE_KEY = 'hybridwk-v4';
let S = null, hydrated = false, persistedJSON = null, storageBlocked = false;
let startupOriginal = null;

function save() {
  if (!hydrated || !S || storageBlocked) return false;
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current !== persistedJSON) {
      try { localStorage.setItem(STORAGE_KEY + ':parallel-window', JSON.stringify(S)); } catch (_) {}
      storageBlocked = true;
      storageNotice('Ein anderes App-Fenster hat neuere Daten. Dieser Stand wird nicht darübergeschrieben. Sichere dieses Fenster unter Setup → Backup und lade die App anschließend neu.');
      return false;
    }
    const serialized = JSON.stringify(S);
    if (serialized !== persistedJSON) localStorage.setItem(STORAGE_KEY, serialized);
    persistedJSON = serialized;
    storageNotice('');
    return true;
  } catch (_) {
    storageNotice('Die letzten Änderungen konnten nicht gespeichert werden. Bitte erstelle im Setup ein Backup, bevor du die App schließt.');
    return false;
  }
}
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[c]);
}
function round25(x) {
  return Math.round(x / 2.5) * 2.5;
}
function paceToSec(p) {
  let m = String(p || '6:30').split(':').map(Number);
  return (m[0] || 0) * 60 + (m[1] || 0);
}
function secToPace(s) {
  return `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
}
function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function today() {
  return dateKey(new Date());
}
function dow() {
  return (new Date().getDay() + 6) % 7;
}
function wk() {
  return W[Math.floor((S.week - 1) / 4)];
}
function wi() {
  return (S.week - 1) % 4;
}
function isDeload() {
  return wi() === 3 && S.week !== 16;
}
function block() {
  return ['Base', 'Build', 'Strength', 'Peak'][Math.floor((S.week - 1) / 4)];
}
function mainSets() { return [isDeload() || S.week === 16 ? 2 : 3, 6]; }
function auxSets() { return isDeload() || S.week === 16 ? 1 : 2; }
function workWeight(key) {
  // Old setup values remain reference data only, never calendar-scaled loads.
  return Number(S.weights[key] || 0);
}
function weekOrder() {
  let order = [...(S.dayOrder[S.week] || PLAN.map((_, i) => i))];
  if (order.length === 7 && order[6] !== 6) {
    let idx = order.indexOf(6),
      swap = order[6];
    if (idx >= 0) {
      order[6] = 6;
      order[idx] = swap;
      S.dayOrder[S.week] = order;
      save();
    }
  }
  return order;
}
function getPlan(day) {
  let order = weekOrder();
  return PLAN[order[day] ?? day];
}
function runDescription(kind) {
  const km = S.runTargets[kind];
  return `${km} km · ${kind === 'long' ? 'langer, lockerer Lauf' : kind === 'quality' && !S.lighter ? 'Qualität nach Tagesform' : 'locker im Gesprächstempo'}`;
}
function targetPace(kind) {
  return kind === 'quality' ? 'nach Gefühl' : S.pace;
}
function toast(s) {
  let t = document.getElementById('toast');
  if (t) {
    t.textContent = s;
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 2500);
  }
}
const STRENGTH_KEYS = ['squat', 'push', 'pull', 'deadlift', 'upper'];
const MAIN_LIFT = {
  squat: 'Back Squat',
  push: 'Bankdrücken und Overhead Press',
  pull: 'Klimmzüge strikt',
  deadlift: 'Deadlift',
  upper: 'Schulterdrücken und Klimmzüge'
};
const FINISHERS = [{
  id: 'upper-burner',
  name: 'Upper Burner',
  format: 'AMRAP',
  min: 8,
  moves: ['8 Push-ups', '10 Ring Rows', '12 Sit-ups'],
  legs: 0,
  hits: ['push', 'pull'],
  scale: 'Push-ups erhöht an der Box, Ring Rows aufrechter stellen.'
}, {
  id: 'core-emom',
  name: 'Core EMOM',
  format: 'EMOM',
  min: 10,
  moves: ['30 s Hollow Hold', '12 Dead Bugs'],
  legs: 0,
  hits: [],
  scale: 'Hollow Hold mit angewinkelten Knien.'
}, {
  id: 'pull-core',
  name: 'Pull & Core',
  format: 'AMRAP',
  min: 10,
  moves: ['10 Ring Rows', '15 Sit-ups', '20 s Side Plank je Seite'],
  legs: 0,
  hits: ['pull'],
  scale: 'Ring Rows aufrechter stellen.'
}, {
  id: 'push-core',
  name: 'Push & Core',
  format: 'AMRAP',
  min: 8,
  moves: ['8 Push-ups', '10 DB Strict Press (leicht)', '12 Sit-ups'],
  legs: 0,
  hits: ['push'],
  scale: 'Leichte Kurzhanteln – sauber vor schnell.'
}, {
  id: 'ladder',
  name: '21-15-9 Ladder',
  format: 'ForTime',
  min: 10,
  scheme: '21-15-9 Wiederholungen',
  moves: ['Ring Rows', 'Push-ups', 'Sit-ups'],
  legs: 0,
  hits: ['push', 'pull'],
  scale: '15-12-9 oder Push-ups auf den Knien.'
}, {
  id: 'row-core',
  name: 'Row & Core',
  format: 'EMOM',
  min: 10,
  moves: ['12 Kal. Rudern (zügig, nicht voll)', '15 Sit-ups'],
  legs: 1,
  hits: [],
  scale: 'Kalorien auf 10 reduzieren.'
}, {
  id: 'bike-hollow',
  name: 'Bike & Hollow',
  format: 'EMOM',
  min: 8,
  moves: ['10 Kal. Bike', '30 s Hollow Rock'],
  legs: 1,
  hits: [],
  scale: 'Kalorien auf 8 reduzieren.'
}, {
  id: 'carry-core',
  name: 'Carry & Core',
  format: 'ForTime',
  min: 10,
  scheme: '4 Runden',
  moves: ['40 m Farmer Carry', '10 Hanging Knee Raises', '20 s Side Plank je Seite'],
  legs: 0,
  hits: ['grip'],
  scale: 'Leichtere Kurzhanteln, Knee Raises liegend.'
}];
const CF = [{
  id: 'cindy',
  name: 'Cindy',
  format: 'AMRAP',
  min: 20,
  moves: ['5 Pull-ups', '10 Push-ups', '15 Air Squats'],
  legs: 2,
  impact: 0,
  warmup: '2 Runden: 250 m Rudern locker, 10 Scap Pull-ups, 10 Air Squats, 5 Inchworms.',
  skill: 'Pull-up-Technik: Kipping-Swings oder 3 × 3 strikte Negativen.',
  scale: 'Ring Rows statt Pull-ups, Push-ups erhöht.',
  stim: 'gleichmäßiges Tempo, 12–20 Runden'
}, {
  id: 'helen',
  name: 'Helen',
  format: 'ForTime',
  min: 15,
  scheme: '3 Runden',
  moves: ['400 m Run', '21 KB Swings 24/16 kg', '12 Pull-ups'],
  legs: 1,
  impact: 1,
  warmup: '400 m locker joggen, dann 2 Runden: 10 KB Deadlifts, 10 Ring Rows, 10 Leg Swings je Seite.',
  skill: 'KB-Swing: 3 × 10 Russian Swings, Hüftstreckung betonen.',
  scale: 'KB 16/12 kg, Ring Rows.',
  stim: 'unter 12 Minuten'
}, {
  id: 'fran',
  name: 'Fran (skaliert)',
  format: 'ForTime',
  min: 10,
  scheme: '21-15-9 Wiederholungen',
  moves: ['Thrusters 30/20 kg', 'Pull-ups'],
  legs: 2,
  impact: 0,
  warmup: '3 Min. Bike, dann 2 Runden: 10 Front Squats mit leerer Stange, 10 Push Press, 5 Scap Pull-ups.',
  skill: 'Thruster aufbauen: 5 × 3 mit steigender Last bis zum WOD-Gewicht.',
  scale: 'Thruster 20/15 kg oder Kurzhanteln, Ring Rows.',
  stim: 'kurz und heftig, 4–8 Minuten'
}, {
  id: 'engine',
  name: 'Engine EMOM',
  format: 'EMOM',
  min: 16,
  moves: ['12 Kal. Rudern', '10 Wall Balls 9/6 kg', '8 Burpees', 'Pause'],
  legs: 2,
  impact: 1,
  warmup: '500 m Rudern locker, dann 2 Runden: 10 Air Squats, 5 langsame Burpees, 10 leichte Wall Balls.',
  skill: 'Wall-Ball-Technik: Tiefe, Hüftstreckung, Zielhöhe – 3 × 8.',
  scale: 'Kalorien reduzieren, Burpees ohne Sprung.',
  stim: 'jede Station in 35–45 s, der Rest ist Pause'
}, {
  id: 'dt',
  name: 'DT (skaliert)',
  format: 'ForTime',
  min: 15,
  scheme: '5 Runden',
  moves: ['9 Deadlifts 70/47 kg', '6 Hang Power Cleans', '3 Push Jerks'],
  legs: 2,
  impact: 0,
  warmup: 'Leere Stange, 2 Runden: 5 RDL, 5 Hang Muscle Cleans, 5 Push Press.',
  skill: 'Hang Power Clean: 5 × 2 steigend, Fokus auf Hüftstreckung.',
  scale: 'Last 50/35 kg; bei Rückenermüdung abbrechen.',
  stim: 'sauber vor schnell, Rücken neutral'
}, {
  id: 'chipper',
  name: 'Chipper',
  format: 'ForTime',
  min: 18,
  scheme: 'Einmal durch',
  moves: ['50 Double-Unders (oder 100 Single-Unders)', '40 Wall Balls 9/6 kg', '30 KB Swings 24/16 kg', '20 Box Jumps', '10 Burpees'],
  legs: 2,
  impact: 1,
  warmup: '3 Min. locker Seilspringen, dann 2 Runden: 10 Air Squats, 5 Box Step-ups, 10 KB Deadlifts.',
  skill: '5 Min. Double-Under-Übung oder Box-Jump-Landungen 3 × 5.',
  scale: 'Step-ups statt Box Jumps.',
  stim: 'konstant bleiben, nicht anrennen'
}, {
  id: 'upper-grinder',
  name: 'Upper Grinder',
  format: 'AMRAP',
  min: 15,
  moves: ['10 Push-ups', '8 Pull-ups (oder 12 Ring Rows)', '10 DB Strict Press', '15 Sit-ups'],
  legs: 0,
  impact: 0,
  warmup: '3 Min. Bike locker, dann 2 Runden: 10 Band Pull-Aparts, 10 Scap Push-ups, 10 Dead Bugs.',
  skill: 'Strikte Klimmzüge: 4 × 3–5 mit 2 Min. Pause.',
  scale: 'Ring Rows, Push-ups auf den Knien.',
  stim: 'saubere Wiederholungen, 6–9 Runden'
}, {
  id: 'row-press',
  name: 'Row & Press',
  format: 'EMOM',
  min: 14,
  moves: ['14 Kal. Rudern (moderat)', '8 DB Push Press + 8 Toes-to-Bar'],
  legs: 1,
  impact: 0,
  warmup: '500 m Rudern locker, dann 2 Runden: 10 Armkreisen, 8 leichte DB Strict Press, 8 Hanging Knee Raises.',
  skill: 'Rudertechnik: Beine – Hüfte – Arme, 3 × 1 Min. bei 24 Schlägen/Min.',
  scale: '10 Kalorien, Knee Raises statt Toes-to-Bar.',
  stim: 'Rudern nicht auf Anschlag – Beine für den Lauf schonen'
}, {
  id: 'bike-core',
  name: 'Bike & Core',
  format: 'ForTime',
  min: 16,
  scheme: '4 Runden',
  moves: ['15 Kal. Bike', '12 Hanging Knee Raises', '10 Push-ups'],
  legs: 1,
  impact: 0,
  warmup: '4 Min. Bike locker, dann 2 Runden: 10 Scap Pull-ups, 10 langsame Push-ups, 20 s Hollow Hold.',
  skill: 'Hollow-Body-Progression: 3 × 20 s Hold + 10 Rocks.',
  scale: '10 Kalorien, Push-ups auf den Knien.',
  stim: 'Bike zügig, Beine aber nicht ausreizen'
}, {
  id: 'gym-emom',
  name: 'Gymnastics EMOM',
  format: 'EMOM',
  min: 12,
  moves: ['5–8 Strict Pull-ups', '10 Hand-Release Push-ups', '30 s Hollow Rock'],
  legs: 0,
  impact: 0,
  warmup: '2 Runden: 10 Band Pull-Aparts, 10 Scap Pull-ups, 10 Superman, 20 s Plank.',
  skill: 'Handstand an der Wand 4 × 20–30 s (oder Pike Hold).',
  scale: 'Band-Klimmzüge, Push-ups auf den Knien.',
  stim: 'jede Minute 15–20 s Pause übrig'
}];
function dayKey(di) { return `${S.cycle>1?S.cycle+'|':''}${S.week}-${di}`; }
function dayMode(di) {
  return S.dayMode?.[dayKey(di)] || 'kraft';
}
function isStrengthDay(p) {
  return !!p && STRENGTH_KEYS.includes(p.key);
}
function shortName(p) {
  return String(p.name).split(' + ')[0];
}
function pickFrom(list, kind, di) {
  if (!list.length) return null;
  let off = S.wodPick?.[`${kind}-${dayKey(di)}`] || 0;
  return list[(S.week + di + off) % list.length];
}
function finisherRules(p, di) {
  let n = getPlan((di + 1) % 7),
    maxLegs = 1,
    why = [];
  if (p.legs) {
    maxLegs = 0;
    why.push('Beine sind heute schon dran – nur Oberkörper und Core');
  }
  if (p.run === 'quality') {
    maxLegs = 0;
    why.push('Qualitätslauf heute – keine Beinlast');
  }
  if (n && (n.run === 'quality' || n.key === 'long')) why.push(`morgen ${n.name} – ohne Sprünge, Laufen und schwere Beine`);
  let avoid = p.key === 'push' ? ['push'] : p.key === 'pull' ? ['pull', 'grip'] : p.key === 'upper' ? ['push', 'pull'] : p.key === 'deadlift' ? ['grip'] : [];
  if (avoid.length) why.push('ergänzt statt doppelt belastet');
  return {
    maxLegs,
    avoid,
    why
  };
}
function finisherFor(p, di) {
  let r = finisherRules(p, di),
    list = FINISHERS.filter(f => f.legs <= r.maxLegs && !f.hits.some(h => r.avoid.includes(h)));
  if (!list.length) list = [FINISHERS[1]];
  return {
    f: pickFrom(list, 'fin', di),
    count: list.length,
    rules: r
  };
}
function finisherMinutes(f) { return 6; }
function cfRules(p, di) {
  let n = getPlan((di + 1) % 7),
    prev = di > 0 ? getPlan(di - 1) : null,
    next2 = getPlan((di + 2) % 7),
    maxLegs = 2,
    impact = 1,
    why = [];
  if (p.run === 'quality') {
    maxLegs = 0;
    impact = 0;
    why.push('Qualitätslauf heute: erst laufen, WOD nur Oberkörper/Core – ohne Sprünge und Laufen.');
  }
  if (prev && prev.legs) {
    maxLegs = 0;
    impact = 0;
    why.push('Gestern Beintag: Beine heute entlasten.');
  }
  if (prev && prev.run === 'quality') {
    maxLegs = Math.min(maxLegs, 1);
    impact = 0;
    why.push('Gestern Qualitätslauf: keine Sprünge, nur leichte Beinlast.');
  }
  if (n && (n.run === 'quality' || n.key === 'long')) {
    maxLegs = Math.min(maxLegs, 1);
    impact = 0;
    why.push(`Morgen ${n.name}: heute ohne Sprünge, Laufen und schwere Beine.`);
  }
  if (next2 && next2.key === 'long') {
    maxLegs = Math.min(maxLegs, 1);
    impact = 0;
    why.push('Long Run übermorgen: schwere Beine und Sprünge heute vermeiden.');
  }
  return {
    maxLegs,
    impact,
    why
  };
}
function cfFor(p, di) {
  let r = cfRules(p, di),
    list = CF.filter(w => w.legs <= r.maxLegs && w.impact <= r.impact);
  return {
    w: pickFrom(list, 'cf', di),
    count: list.length,
    rules: r
  };
}
function fmtLabel(x, min) {
  return x.format === 'ForTime' ? `For Time · Cap ${min} Min.` : `${x.format} ${min} Min.`;
}
function fmtShort(x) {
  return x.format === 'ForTime' ? 'For Time' : `${x.format} ${x.min}`;
}
function moveList(x) {
  let emom = x.format === 'EMOM' && x.moves.length > 1;
  return `${x.scheme ? `<div class="small ember" style="margin-top:8px">${esc(x.scheme)}</div>` : ''}${emom ? '<div class="tiny muted" style="margin-top:8px">Stationen wechseln jede Minute</div>' : ''}<ol class="moves">${x.moves.map((m, i) => `<li>${emom ? `<span class="muted">Min. ${i + 1}:</span> ` : ''}${esc(m)}</li>`).join('')}</ol>`;
}
function wodLog(kind,di) { return S.logs.slice().reverse().find(l=>l.type===(kind==='crossfit'?'crossfit':'metcon') && samePlanDay(l,di)); }
function choiceLocked(p,di) {
  return !!(S.session && S.session.week===S.week && S.session.day===di) || !!(S.wodRun && S.wodRun.week===S.week && S.wodRun.day===di) || S.logs.some(l=>samePlanDay(l,di) && ['strength','crossfit'].includes(l.type));
}
function modeCard(di) {
  const p=getPlan(di), mode=dayMode(di), locked=choiceLocked(p,di);
  return `<div class="card mode-card"><b>${di===dow()?'Heute':DAYS[di]}: Dein Trainingsfokus</b><p class="small muted">${locked?'Dein begonnener oder gespeicherter Kraftteil legt die Wahl fest.':'Kraft bleibt der Standard. CrossFit ersetzt diesen Kraftteil; ein geplanter Lauf bleibt separat.'}</p><div class="mode" role="group" aria-label="Trainingsart"><button class="mode-opt ${mode==='kraft'?'selected':''}" data-daymode="kraft" data-modeday="${di}" aria-pressed="${mode==='kraft'}" ${locked?'disabled':''}><b>Kraft</b><span>${esc(shortName(p))}</span></button><button class="mode-opt cf ${mode==='crossfit'?'selected':''}" data-daymode="crossfit" data-modeday="${di}" aria-pressed="${mode==='crossfit'}" ${locked?'disabled':''}><b>CrossFit</b><span>WOD statt Kraft</span></button></div></div>`;
}
function todayChoice() {
  let di = dow(),
    p = getPlan(di);
  if (!isStrengthDay(p)) return `<div class="card small muted">Heute steht ${esc(p.name)} an – hier ist kein Tausch gegen CrossFit vorgesehen.</div>`;
  return modeCard(di) + `<button class="outline" data-go="training" style="width:100%">${dayMode(di) === 'crossfit' ? 'Zum WOD' : 'Zur Krafteinheit'} ↗</button>`;
}
function finisherCard(p,di) {
  const {f,count}=finisherFor(p,di),saved=S.logs.slice().reverse().find(l=>samePlanDay(l,di)&&l.type==='strength'),done=wodLog('finisher',di),ready=!!saved&&saved.closed!==false&&saved.extra==='finisher'&&(saved.duration||0)<=54;
  return `<div class="card fin-card" id="finisher"><span class="pill tag-cf">Optional · 6 Minuten</span><h3 class="wod-name">${esc(f.name)}</h3>${moveList(f)}<p class="small muted">${esc(f.scale)} Kontrolliert zügig, mit sauberer Technik.</p><p class="small muted">${!saved?'Zuerst den verkürzten Kraftteil speichern.':(saved.duration||0)>54?'Dein Kraftteil hat das Zeitbudget bereits ausgeschöpft. Für heute ist der Finisher ausgesetzt.':'Der Finisher ersetzt die letzte Ergänzungsübung.'}</p>${done?`<p class="done-line">✓ ${esc(done.result)}</p>`:''}<div class="actions"><button class="primary" data-wod-start="finisher" data-wod-day="${di}" ${!ready||done?'disabled':''}>Finisher starten</button><button class="outline" data-wod-log="finisher" data-wod-day="${di}" ${!ready||done?'disabled':''}>Ergebnis eintragen</button>${count>1&&!done?`<button class="outline" data-wod-next="fin" data-wod-day="${di}">Anderer Finisher</button>`:''}</div></div>`;
}
function crossfitView(p, di) {
  let {
      w,
      count,
      rules
    } = cfFor(p, di),
    done = wodLog('crossfit', di),
    weekCf = Object.keys(S.dayMode || {}).filter(k => k.startsWith((S.cycle>1?S.cycle+'|':'')+S.week+'-') && S.dayMode[k] === 'crossfit').length,
    total = 27 + w.min;
  return `<section class="section"><div class="card cf-head"><div class="row start"><div><span class="pill tag-cf">${DAYS[di]} · CrossFit statt ${esc(shortName(p))}</span><h2 style="margin:10px 0 3px">${esc(w.name)}</h2><div class="small muted">${fmtLabel(w, w.min)} · Kursformat ca. ${total} Min.</div></div><div class="big ember">${w.min}′</div></div>${isDeload() ? '<p class="small ember">Deload-Woche: etwa 60–70 % Last, RPE 6–7, lieber skalieren.</p>' : ''}${S.week === 16 ? '<p class="small ember">Testwoche: Für vergleichbare Testwerte ist Kraft heute die bessere Wahl.</p>' : ''}${rules.why.length ? `<div class="small ${rules.maxLegs < 2 ? 'ember' : 'muted'}" style="margin-top:8px">${rules.why.map(esc).join('<br>')}</div>` : ''}${done ? `<div class="done-line">✓ Erledigt · ${esc(done.result || '')}</div>` : ''}<div class="actions"><button class="primary" data-wod-start="crossfit" data-wod-day="${di}">${done ? 'Nochmal starten' : 'WOD-Timer starten'}</button><button class="outline" data-wod-log="crossfit" data-wod-day="${di}">Nur eintragen</button>${count > 1 ? `<button class="outline" data-wod-next="cf" data-wod-day="${di}">Anderes WOD</button>` : ''}</div></div><div class="card steps"><div class="step"><i>1</i><div><b>Warm-up · 10 Min.</b><div class="small muted">${esc(w.warmup)}</div></div></div><div class="step"><i>2</i><div><b>Skill / Kraft · 12 Min.</b><div class="small muted">${esc(w.skill)}</div></div></div><div class="step"><i>3</i><div><b>WOD · ${fmtLabel(w, w.min)}</b>${moveList(w)}<div class="small muted">Ziel: ${esc(w.stim)} · Skalierung: ${esc(w.scale)}</div></div></div><div class="step"><i>4</i><div><b>Cooldown · 5 Min.</b><div class="small muted">Locker ausfahren oder gehen, Hüfte, Waden und Schultern mobilisieren.</div></div></div></div><div class="card small muted">Heute entfällt ${esc(MAIN_LIFT[p.key] || shortName(p))}. Arbeitsgewichte und Gewichtsvorschläge bleiben unverändert; das WOD zählt als erledigte Tageseinheit.${p.run ? ' Der Lauf unten bleibt geplant.' : ''}${weekCf >= 3 ? ` <span class="ember">Schon ${weekCf}× CrossFit diese Woche – die Kraftprogression pausiert für die ausgelassenen Hauptlifts.</span>` : ''}</div><div class="card"><div class="row"><span class="small muted">Wenn Beschwerden oder ungewöhnliche Symptome auftreten: abbrechen und abklären lassen.</span><button class="outline" data-move="${di}">Verschieben</button></div></div></section>`;
}
const LEAD = 10000;
let wodTimerId = null,
  audioCtx = null,
  wakeLock = null,
  lastCue = null;
function fmtSec(sec) {
  let n = Math.max(0, Math.floor(sec));
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
}
function parseClock(v) {
  let t = String(v || '').trim();
  let m = t.match(/^(\d{1,3}):([0-5]\d)$/);
  if (m) return +m[1] * 60 + +m[2];
  if (/^\d+([.,]\d+)?$/.test(t)) return Math.round(parseFloat(t.replace(',', '.')) * 60);
  return null;
}
function beep(freq, ms) {
  try {
    let AC = window.AudioContext || window.webkitAudioContext;
    if (AC) {
      audioCtx = audioCtx || new AC();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      let o = audioCtx.createOscillator(),
        g = audioCtx.createGain(),
        t = audioCtx.currentTime;
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(.0001, t);
      g.gain.exponentialRampToValueAtTime(.25, t + .02);
      g.gain.exponentialRampToValueAtTime(.0001, t + ms / 1000);
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start(t);
      o.stop(t + ms / 1000 + .05);
    }
  } catch (_) {}
  try {
    navigator.vibrate?.(Math.min(ms, 300));
  } catch (_) {}
}
async function keepAwake(on) {
  try {
    if (on) {
      if (!wakeLock && navigator.wakeLock?.request) {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener?.('release', () => {
          wakeLock = null;
        });
      }
    } else if (wakeLock) {
      let w = wakeLock;
      wakeLock = null;
      await w.release();
    }
  } catch (_) {
    wakeLock = null;
  }
}
function wodStart(kind,di,manual) {
  const p=getPlan(di);if(!isStrengthDay(p))return;
  if(S.session||S.tri?.active||S.wodRun){toast('Bitte die begonnene Einheit zuerst abschließen.');return;}
  if(kind==='crossfit'&&dayMode(di)!=='crossfit'){toast('Wähle zuerst CrossFit als Trainingsart.');return;}
  if(kind!=='crossfit'){
    const strength=S.logs.slice().reverse().find(l=>samePlanDay(l,di)&&l.type==='strength');
    if(extraChoice(di)!=='finisher'||!strength||strength.extra!=='finisher'||strength.closed===false||strength.duration>54||wodLog('finisher',di)){toast('Der Finisher braucht einen abgeschlossenen Kraftteil und 6 freie Minuten.');return;}
  }
  const x=kind==='crossfit'?cfFor(p,di).w:finisherFor(p,di).f,min=kind==='crossfit'?x.min:6;
  S.wodRun={kind,logId:DATA.uid('wod'),cycle:S.cycle,contextId:S.contextId,day:di,week:S.week,key:p.key,id:x.id,name:x.name,format:x.format,min,moves:x.moves.slice(),scheme:x.scheme||'',legs:x.legs||0,started:null,pausedAt:null,paused:0,rounds:0,stopped:null,ended:!!manual,manual:!!manual,capped:false,rpe:8};
  S.tab='training';S.selectedDay=di;save();render();window.scrollTo?.(0,0);
}
function wodElapsed(r) {
  if (!r.started) return -LEAD;
  let now = r.stopped || r.pausedAt || Date.now();
  return now - r.started - r.paused;
}
function wodSync() {
  let r = S.wodRun;
  if (!r || r.ended || !r.started || r.pausedAt) return false;
  if (wodElapsed(r) >= r.min * 60000) {
    r.stopped = r.started + r.paused + r.min * 60000;
    r.ended = true;
    r.capped = r.format === 'ForTime';
    save();
    keepAwake(false);
    return true;
  }
  return false;
}
function wodClock(r) {
  let cap = r.min * 60000,
    e = wodElapsed(r);
  if (!r.started) return {
    main: r.format === 'ForTime' ? '0:00' : r.format === 'EMOM' ? '1:00' : fmtSec(r.min * 60),
    sub: 'Bereit · 10 s Vorlauf nach dem Start',
    station: r.format === 'EMOM' ? `Min. 1: ${r.moves[0]}` : '',
    pct: 0,
    phase: 'ready'
  };
  if (e < 0) return {
    main: String(Math.ceil(-e / 1000)),
    sub: 'Gleich geht’s los',
    station: r.format === 'EMOM' ? `Min. 1: ${r.moves[0]}` : '',
    pct: 0,
    phase: 'lead'
  };
  let pct = Math.min(100, e / cap * 100);
  if (r.format === 'AMRAP') return {
    main: fmtSec(Math.ceil((cap - e) / 1000)),
    sub: `${r.rounds} ${r.rounds === 1 ? 'Runde' : 'Runden'}`,
    station: '',
    pct,
    phase: 'run'
  };
  if (r.format === 'EMOM') {
    let m = Math.min(r.min - 1, Math.floor(e / 60000));
    return {
      main: fmtSec(Math.ceil((60000 - (e - m * 60000)) / 1000)),
      sub: `Minute ${m + 1} / ${r.min}`,
      station: r.moves[m % r.moves.length],
      pct,
      phase: 'run',
      minute: m
    };
  }
  return {
    main: fmtSec(e / 1000),
    sub: `Time Cap ${r.min}:00`,
    station: '',
    pct,
    phase: 'run'
  };
}
function wodTick() {
  let r = S.wodRun,
    el = document.getElementById('wodClock');
  if (!r || !el) {
    clearInterval(wodTimerId);
    wodTimerId = null;
    return;
  }
  if (wodSync()) {
    beep(660, 700);
    render();
    return;
  }
  let c = wodClock(r),
    set = (id, v) => {
      let n = document.getElementById(id);
      if (n && n.textContent !== v) n.textContent = v;
    };
  set('wodClock', c.main);
  el.classList.toggle('lead', c.phase === 'lead');
  set('wodSub', c.sub);
  set('wodStation', c.station);
  let bar = document.getElementById('wodBar');
  if (bar) bar.style.width = c.pct + '%';
  let e = wodElapsed(r),
    cue = null;
  if (e < 0 && e > -3500) cue = 'l' + Math.ceil(-e / 1000);else if (e >= 0 && e < 1000) cue = 'go';else if (r.format === 'EMOM' && c.minute > 0 && e - c.minute * 60000 < 1000) cue = 'm' + c.minute;else if (r.min * 60000 - e < 3500) cue = 'e' + Math.ceil((r.min * 60000 - e) / 1000);
  if (cue && cue !== lastCue) {
    lastCue = cue;
    if (cue === 'go' || cue[0] === 'm') {
      beep(988, 350);
      let card = document.getElementById('wodCard');
      if (card) {
        card.classList.remove('flash');
        void card.offsetWidth;
        card.classList.add('flash');
      }
    } else beep(660, 120);
  }
}
function wodResultView(r) {
  let e = r.manual ? 0 : Math.max(0, wodElapsed(r)),
    fields = '';
  if (r.format === 'AMRAP') fields = `<div><label for="wodRounds">Runden</label><input id="wodRounds" type="number" min="0" inputmode="numeric" value="${r.rounds || ''}"></div><div><label for="wodReps">+ Wiederholungen</label><input id="wodReps" type="number" min="0" inputmode="numeric" placeholder="0"></div>`;else if (r.format === 'EMOM') fields = `<div><label for="wodRounds">Minuten sauber geschafft</label><input id="wodRounds" type="number" min="0" max="${r.min}" inputmode="numeric" value="${r.manual ? r.min : Math.min(r.min, Math.floor(e / 60000))}"></div>`;else fields = `<div><label for="wodTime">Zeit (mm:ss)</label><input id="wodTime" inputmode="numeric" placeholder="8:34" value="${!r.manual && !r.capped ? fmtSec(e / 1000) : ''}"></div><div><label for="wodReps">Wdh. bei Time Cap</label><input id="wodReps" type="number" min="0" inputmode="numeric" placeholder="—"></div><div class="span2"><label class="check-line"><input id="wodCapped" type="checkbox" ${r.capped ? 'checked' : ''}> Time Cap erreicht</label></div>`;
  return `<div class="card"><span class="pill ${r.kind === 'crossfit' ? 'tag-cf' : ''}">${r.manual ? 'Ergebnis eintragen' : r.capped ? 'Time Cap erreicht' : 'Geschafft'}</span><h2 style="margin:10px 0 4px">${esc(r.name)}</h2><div class="small muted">${fmtLabel(r, r.min)}${r.manual ? '' : ` · gestoppt bei ${fmtSec(e / 1000)}`}</div><div class="formgrid" style="margin-top:14px">${fields}${r.kind === 'crossfit' ? `<div><label for="wodTotal">Gesamtdauer (Min.)</label><input id="wodTotal" type="number" min="1" inputmode="numeric" value="${27 + r.min}"><div class="tiny muted" style="margin-top:4px">inkl. Warm-up und Skill</div></div>` : ''}<div class="span2"><label for="wodNote">Notiz (optional)</label><input id="wodNote" maxlength="200" placeholder="z. B. 16-kg-KB, Ring Rows"></div></div><div style="margin-top:14px"><span class="small muted">Anstrengung (RPE)</span><div class="rpe-row" role="group" aria-label="RPE wählen">${[6, 7, 8, 9, 10].map(n => `<button class="chip ${(r.rpe || 8) === n ? 'selected' : ''}" data-wod-rpe="${n}" aria-pressed="${(r.rpe || 8) === n}">${n}</button>`).join('')}</div></div><div class="actions"><button class="primary" data-wod-save>Ergebnis speichern</button><button class="outline" data-wod-exit>Verwerfen</button></div></div>`;
}
function wodRunView() {
  let r = S.wodRun;
  if (!r) return '';
  wodSync();
  let head = `<div class="row wod-top"><button class="outline" data-wod-exit>${r.ended ? 'Verwerfen' : 'Abbrechen'}</button><span class="pill ${r.kind === 'crossfit' ? 'tag-cf' : ''}">${r.kind === 'crossfit' ? 'CrossFit' : 'Finisher'} · ${fmtShort(r)}</span></div><div class="small muted center" style="margin-top:8px">${esc(r.name)}</div>`;
  if (r.ended) return `<section class="section">${head}${wodResultView(r)}</section>`;
  let c = wodClock(r),
    running = !!r.started && !r.pausedAt,
    pause = `<button class="outline" data-wod-pause>${r.pausedAt ? 'Fortsetzen' : 'Pause'}</button>`,
    controls = !r.started ? `<button class="primary round-btn" data-wod-go>Start</button><p class="tiny muted center">10 s Vorlauf · Signalton zum Start</p>` : r.format === 'AMRAP' ? `<button class="primary round-btn" data-wod-round ${running ? '' : 'disabled'}>+1 Runde</button><div class="actions"><button class="outline" data-wod-unround ${r.rounds ? '' : 'disabled'}>−1 Runde</button>${pause}<button class="outline" data-wod-end>Beenden</button></div>` : r.format === 'ForTime' ? `<button class="primary round-btn" data-wod-stop>Fertig · Zeit stoppen</button><div class="actions">${pause}</div>` : `<div class="actions">${pause}<button class="outline" data-wod-end>Beenden</button></div>`;
  return `<section class="section">${head}<div class="card clock-card ${r.kind === 'crossfit' ? 'cf' : ''}" id="wodCard"><div class="small muted">${fmtLabel(r, r.min)}${r.scheme ? ' · ' + esc(r.scheme) : ''}</div><div class="clock ${c.phase === 'lead' ? 'lead' : ''}" id="wodClock" role="timer" aria-label="WOD-Uhr">${c.main}</div><div class="wod-sub" id="wodSub" aria-live="polite">${esc(c.sub)}</div><div class="station" id="wodStation">${esc(c.station)}</div><div class="bar" style="margin-top:14px"><i id="wodBar" style="width:${c.pct}%"></i></div>${r.pausedAt ? '<div class="pill" style="margin-top:12px">Pausiert</div>' : ''}</div>${controls}<div class="card"><b>Ablauf</b>${moveList(r)}</div><p class="tiny muted">Signaltöne beim Start${r.format === 'EMOM' ? ', zu jeder neuen Minute' : ''} und kurz vor Schluss. Bei stummgeschaltetem iPhone sind sie evtl. nicht hörbar – die Uhr läuft trotzdem weiter.</p></section>`;
}
function wodSave(vals) {
  const r=S.wodRun;if(!r)return 'Kein WOD aktiv.';vals=vals||{};
  let wodMin=r.manual?r.min:Math.max(.1,Math.round(Math.max(0,wodElapsed(r))/6000)/10),result='';
  const rounds=Number(vals.rounds||0),reps=Number(vals.reps||0);
  if(!Number.isInteger(rounds)||rounds<0||rounds>10000||!Number.isInteger(reps)||reps<0||reps>100000)return 'Bitte gültige Runden und Wiederholungen eintragen.';
  if(r.format==='AMRAP')result=`${rounds} Runden${reps?' + '+reps+' Wdh.':''}`;
  else if(r.format==='EMOM'){if(rounds>r.min)return 'Mehr abgeschlossene Minuten als geplant sind nicht möglich.';result=`${rounds}/${r.min} Minuten sauber`;}
  else if(vals.capped){result=`Time Cap · ${reps} Wdh.`;wodMin=r.min;}
  else{const seconds=parseClock(vals.time);if(!(seconds>0&&seconds<=r.min*60))return 'Zeit bitte innerhalb des Time Caps als mm:ss eingeben.';result=fmtSec(seconds);wodMin=seconds/60;}
  const rpe=r.rpe||8,effort=rpe<=6?'light':rpe>=9?'hard':'normal',total=Number(vals.total),duration=r.kind==='crossfit'?(Number.isFinite(total)&&total>0?total:wodMin):wodMin;
  if(duration<wodMin||duration>120)return 'Gesamtdauer bitte zwischen WOD-Dauer und 120 Minuten eintragen.';
  const log={id:r.logId||DATA.uid('wod'),legacy:false,type:r.kind==='crossfit'?'crossfit':'metcon',name:`${r.kind==='crossfit'?'CrossFit':'Finisher'} · ${r.name}`,key:r.key,week:r.week,cycle:r.cycle||S.cycle,day:r.day,date:today(),contextId:r.contextId||S.contextId,duration,load:Math.round(duration*(S.loadFactors[effort]??.7)*10)/10,effort,rpe,format:r.format,result,wodId:r.id,legs:r.legs,note:String(vals.note||'').slice(0,200)};
  S.logs=DATA.upsertLog(S.logs,log);S.wodRun=null;clearInterval(wodTimerId);save();keepAwake(false);render();toast('WOD gespeichert · '+result);return '';
}
function bindWod() {
  let r = S.wodRun;
  if (!r) return;
  let q = s => document.querySelector(s);
  q('[data-wod-go]')?.addEventListener('click', () => {
    beep(440, 40);
    r.started = Date.now() + LEAD;
    r.pausedAt = null;
    r.paused = 0;
    lastCue = null;
    save();
    keepAwake(true);
    render();
  });
  q('[data-wod-pause]')?.addEventListener('click', () => {
    if (r.pausedAt) {
      r.paused += Date.now() - r.pausedAt;
      r.pausedAt = null;
      keepAwake(true);
    } else r.pausedAt = Date.now();
    save();
    render();
  });
  q('[data-wod-round]')?.addEventListener('click', () => {
    r.rounds++;
    save();
    render();
  });
  q('[data-wod-unround]')?.addEventListener('click', () => {
    r.rounds = Math.max(0, r.rounds - 1);
    save();
    render();
  });
  q('[data-wod-stop]')?.addEventListener('click', () => {
    if (wodElapsed(r) < 0) {
      toast('Der Vorlauf läuft noch.');
      return;
    }
    r.stopped = r.pausedAt || Date.now();
    r.ended = true;
    r.capped = false;
    save();
    keepAwake(false);
    beep(660, 500);
    render();
  });
  q('[data-wod-end]')?.addEventListener('click', () => {
    if (!confirm('Vorzeitig beenden und Ergebnis eintragen?')) return;
    r.stopped = r.pausedAt || Date.now();
    r.ended = true;
    save();
    keepAwake(false);
    render();
  });
  document.querySelectorAll('[data-wod-exit]').forEach(b => b.onclick = () => {
    if (!confirm(r.ended ? 'Ergebnis verwerfen? Es wird nichts gespeichert.' : 'WOD abbrechen? Es wird nichts gespeichert.')) return;
    S.wodRun = null;
    clearInterval(wodTimerId);
    keepAwake(false);
    save();
    render();
  });
  document.querySelectorAll('[data-wod-rpe]').forEach(b => b.onclick = () => {
    r.rpe = +b.dataset.wodRpe;
    save();
    document.querySelectorAll('[data-wod-rpe]').forEach(x => {
      x.classList.toggle('selected', x === b);
      x.setAttribute('aria-pressed', String(x === b));
    });
  });
  q('[data-wod-save]')?.addEventListener('click', () => {
    let v = id => document.getElementById(id)?.value,
      err = wodSave({
        rounds: v('wodRounds'),
        reps: v('wodReps'),
        time: v('wodTime'),
        total: v('wodTotal'),
        note: v('wodNote'),
        capped: !!document.getElementById('wodCapped')?.checked
      });
    if (err) toast(err);
  });
  clearInterval(wodTimerId);
  wodTimerId = null;
  if (r.started && !r.ended && !r.pausedAt) wodTimerId = setInterval(wodTick, 250);
}
document.addEventListener('visibilitychange', () => {
  let r = S?.wodRun;
  if (document.visibilityState === 'visible' && r && r.started && !r.ended && !r.pausedAt) {
    keepAwake(true);
    if (wodSync()) render();
  }
});
function collision(order) {
  let problems = [];
  for (let d = 0; d < 7; d++) {
    let a = PLAN[order[d]],
      b = PLAN[order[(d + 1) % 7]];
    if (a.legs && b.hard) problems.push({
      type: 'Kollision',
      days: [d, (d + 1) % 7],
      text: `${DAYS[d]} schwere Beine direkt vor ${DAYS[(d + 1) % 7]} hartem Lauf`
    });
    if (a.hard && b.legs) problems.push({
      type: 'Hinweis',
      days: [d, (d + 1) % 7],
      text: `${DAYS[d]} harter Lauf direkt vor ${DAYS[(d + 1) % 7]} Beinen`
    });
    if (a.hard && b.hard) problems.push({
      type: 'Kollision',
      days: [d, (d + 1) % 7],
      text: 'Zwei harte Läufe direkt hintereinander'
    });
    if (a.legs && b.legs) problems.push({
      type: 'Hinweis',
      days: [d, (d + 1) % 7],
      text: 'Zwei Beintage direkt hintereinander'
    });
  }
  return problems;
}
function nav() {
  const icons = {"programm": "<path d=\"m3 11 9-8 9 8v10H3z\"/><path d=\"M9 21v-7h6v7\"/>", "training": "<path d=\"m8 4 12 8-12 8z\"/>", "verlauf": "<path d=\"M4 19V5m0 14h16M7 15l4-5 4 2 5-7\"/>", "analyse": "<path d=\"M4 20v-6m5 6V9m6 11V4m5 16V11\"/>", "setup": "<path d=\"M4 7h16M4 17h16\"/><circle cx=\"9\" cy=\"7\" r=\"3\"/><circle cx=\"16\" cy=\"17\" r=\"3\"/>"};
  return `<nav class="tabs" aria-label="Hauptnavigation">${[['programm','Plan'],['training','Training'],['verlauf','Verlauf'],['analyse','Analyse'],['setup','Setup']].map(([id,label])=>`<button class="tab ${S.tab===id?'active':''}" data-tab="${id}" aria-label="${label}" aria-current="${S.tab===id?'page':'false'}"><span class="ico"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[id]}</svg></span>${label}</button>`).join('')}</nav>`;
}
function header() {
  return `<header id="top" class="top"><div class="eyebrow"><span class="top-brand"><img src="icon-180.png" alt="">HYBRID/WK</span> · WOCHE ${S.week} · ${block().toUpperCase()}</div><div class="title">${{programm:'Dein Plan',training:'Training',verlauf:'Verlauf',analyse:'Analyse',setup:'Setup'}[S.tab] || 'Dein Plan'}</div>${(S.session && !S.session.paused) || (S.tri?.active && !S.tri.active.paused) || S.wodRun ? '' : nav()}</header>`;
}
function render() {
  if (!S || !hydrated) return;
  const activeStrength = S.session && !S.session.paused;
  const activeTri = S.tri?.active && !S.tri.active.paused;
  let body = activeTri ? triRunView() : activeStrength ? sessionView() : S.wodRun ? wodRunView() : ({
    programm: program, training: training, verlauf: history, analyse: analysis, setup: setup
  }[S.tab] || program)();
  const resume = !activeStrength && !activeTri && !S.wodRun && (S.session || S.tri?.active)
    ? `<div class="card context-notice"><b>Training ist pausiert</b><p class="small muted">Deine bestätigten Sätze bleiben erhalten. Die Trainingszeit läuft erst beim Fortsetzen weiter.</p><button class="primary" data-resume>Training fortsetzen</button></div>` : '';
  document.getElementById('app').innerHTML = header() + `<main class="content">${resume}${body}</main><div id="toast" class="hidden" role="status"></div>`;
  bind(); bindRefresh();
  if (activeStrength) bindSession();
  if (activeTri) bindTri();
  if (S.wodRun && !activeStrength && !activeTri) bindWod();
  restoreRestTimer();
}
function weekOverview() {
  return `<div class="list">${weekOrder().map((pi,di) => {
    const p = PLAN[pi], status = dayStatus(di), cf = isStrengthDay(p) && dayMode(di) === 'crossfit';
    const desc = isStrengthDay(p) ? (cf ? 'WOD ersetzt den Kraftteil' : `${buildDay(di).reduce((n,e)=>n+e.prescribedSets,0)} Arbeitssätze · ca. 55–60 Min.`) : p.run ? runDescription(p.run) : 'Bewegung & Erholung';
    return `<div class="listrow"><button class="subtle" data-day="${di}" aria-label="${DAYS[di]} ansehen">${DAYS[di]}</button><div class="grow"><b>${esc(cf ? 'CrossFit' + (p.run ? ' + Lauf' : '') : p.name)}</b><div class="small muted">${esc(desc)}</div><div class="tiny muted">${status.label}</div></div><button class="check ${status.complete ? 'done' : ''}" data-done="${di}" aria-label="${DAYS[di]} manuell markieren">${status.complete ? '✓' : status.partial ? '◐' : '○'}</button></div>`;
  }).join('')}</div><p class="tiny muted">Kraft und Lauf zählen einzeln. Ein manuelles Häkchen ist eine Notiz und erzeugt keine Leistungsdaten.</p>`;
}
function smallestSafeSwap(order) {
  let base = collision(order),
    baseHard = base.filter(x => x.type === 'Kollision').length,
    baseHints = base.filter(x => x.type === 'Hinweis').length,
    best = null;
  for (let i = dow(); i < 7; i++) for (let j = i + 1; j < 7; j++) {
    if (i === 6 || j === 6 || order[i] === 6 || order[j] === 6 || dayStatus(i).complete || dayStatus(j).complete) continue;
    let next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    let c = collision(next),
      hard = c.filter(x => x.type === 'Kollision').length,
      hints = c.filter(x => x.type === 'Hinweis').length;
    if (hard < baseHard || hard === baseHard && hints < baseHints) {
      let score = hard * 10 + hints;
      if (!best || score < best.score) best = {
        from: i,
        to: j,
        score,
        hard,
        hints
      };
    }
  }
  return best;
}
function program() {
  const done = PLAN.filter((p,i)=>i<6 && dayStatus(i).complete).length;
  const c = collision(weekOrder());
  return `<section class="hero"><div class="hero-kicker"><span class="hero-dot"></span>HYBRID / WK · DEIN NÄCHSTER BLOCK</div><h1>Stronger.<em>Every week.</em></h1><p>Kraft mit klarem Fokus. Läufe in deinem Rhythmus. Fortschritt, den du sehen kannst.</p><button class="primary hero-cta" data-go="training">Training öffnen <span aria-hidden="true">↗</span></button><div class="hero-state"><span>ZYKLUS ${S.cycle}</span><b>${block()} · WOCHE ${S.week} / 16</b></div></section>${S.migrationNotice ? '<div class="card context-notice"><b>Dein Verlauf ist übernommen.</b><p class="small muted">Woche, Einträge und Einstellungen bleiben erhalten. Alte Zusammenfassungen sind im Verlauf sichtbar. Neue Gewichtsvorschläge lernen aus deinen künftig bestätigten Sätzen.</p><button class="outline" data-dismiss-migration>Verstanden</button></div>' : ''}<section class="section"><div class="grid"><div class="metric"><span class="muted">Wochentage</span><b>${done}/6</b></div><div class="metric"><span class="muted">Kraftzeit</span><b>55–60′</b></div><div class="metric"><span class="muted">Easy Run</span><b>${S.runTargets.easy} km</b></div><div class="metric"><span class="muted">Long Run</span><b>${S.runTargets.long} km</b></div></div></section><section class="section"><h2>Deine Woche</h2>${weekOverview()}<div class="actions"><button class="outline" data-move-current>Einheit verschieben</button><button class="outline" data-weekfinish>Woche abschließen</button></div></section><section class="section"><h2>Heute zählt</h2>${todayChoice()}<div class="card"><b>${isDeload() ? 'Entlasten und sauber bewegen' : S.week===16 ? 'Bilanz ziehen' : 'Eine gute Wiederholung mehr'}</b><p class="small muted">${isDeload() || S.week===16 ? 'Diese Woche weniger Arbeitssätze, keine automatischen Steigerungen. In Woche 16 kannst du vertraute Leistungen vergleichen; ein Maximaltest ist optional.' : 'Trainiere meist mit 1–2 sauberen Wiederholungen Reserve. Erreichst du in allen Sätzen die Obergrenze mit mindestens 2 RIR, bietet die App beim nächsten Mal den nächsten Gewichtsschritt an.'}</p></div>${c.length ? `<details class="card"><summary>Belastung in der Wochenfolge</summary>${c.map(x=>`<p class="small muted">${esc(x.text)}</p>`).join('')}<p class="small muted">Bei müden Beinen den Qualitätslauf locker gestalten oder einen Trainingstag verschieben.</p></details>`:''}</section><section class="section"><h2>Deine Routine</h2>${routinePanel()}</section><section class="section"><h2>Mahlzeiten heute</h2>${mealPanel()}</section>`;
}
function mealPanel() {
  S.meals = S.meals || {};
  let eaten = S.meals[today()] || {};
  return `<div class="card tight">${['Frühstück', 'Mittagessen', 'Abendessen'].map((name, i) => `<div class="listrow"><span>${name}</span><button class="check ${eaten[i] ? 'done' : ''}" data-meal="${i}">${eaten[i] ? '✓' : '○'}</button></div>`).join('')}<p class="tiny muted">Nur abhaken – keine Kalorien oder Ernährungswerte geschätzt.</p></div>`;
}
function routinePanel(recovery = false) {
  let t = today(),
    r = S.routine[t] || [],
    items = ['Tageslicht', 'Wasser', 'Protein', 'Schritte', 'Hautpflege', 'Bildschirm aus', 'Feste Schlafenszeit', 'Zähne'];
  if (S.creatine) items.push('Kreatin eingenommen');
  if (S.caffeine && !recovery) items.push('Koffein vor Training');
  let sleep = S.sleep.filter(x => x.date >= dateAgo(6)).map(x => x.hours);
  let avg = sleep.length ? (sleep.reduce((a, b) => a + b, 0) / sleep.length).toFixed(1) : '—';
  return `<div class="card tight"><div class="row"><b>${r.length}/${items.length} erledigt</b><span class="pill">Serie ${routineStreak()} Tage</span></div>${items.map((x, i) => `<div class="listrow"><span class="small">${x}</span><button class="check ${r.includes(i) ? 'done' : ''}" data-routine="${i}">${r.includes(i) ? '✓' : '○'}</button></div>`).join('')}<div class="formgrid" style="padding:12px 4px 3px"><div><label>Schlaf letzte Nacht (Std.)</label><input id="sleepValue" type="number" min="0" max="16" step="0.1" value="${S.sleep.find(x => x.date === t)?.hours ?? ''}"></div><div><label>7-Tage-Schnitt</label><div class="metric"><b>${avg}</b><span class="small muted">Stunden</span></div></div></div><button class="primary" data-save-sleep style="margin:8px 4px 2px">Schlaf speichern</button></div>`;
}
function dateAgo(days) {
  let d = new Date();
  d.setDate(d.getDate() - days);
  return dateKey(d);
}
function routineStreak() {
  let n = 0,
    d = new Date(),
    todayPoints = (S.routine[today()] || []).length;
  if (todayPoints < 5) d.setDate(d.getDate() - 1);
  for (let i = 0; i < 366; i++) {
    let k = dateKey(d);
    if ((S.routine[k] || []).length < 5) break;
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
function workoutDesc(day) {
  let p = getPlan(day);
  if (!p) return '—';
  if (p.run) return runDescription(p.run);
  return p.name;
}
function rehabView(di) {
  S.rehab = S.rehab || {};
  let st = S.rehab[today()] || {},
    tasks = [['walk', 'Locker spazieren oder kurz bewegen'], ['mobility', 'Sanfte Mobilität nach Gefühl'], ['mealPrep', 'Mahlzeiten für morgen grob planen'], ['sleepPlan', 'Schlafenszeit für heute festlegen']];
  return `<section class="section"><div class="card"><span class="pill">${DAYS[di]} · REHAB & RECOVERY</span><div class="big" style="margin:12px 0">Reset statt Training</div><p class="muted">Sonntag ist trainingsfrei: kein Krafttraining, Lauf oder WOD. Das ist allgemeine Regeneration, kein Behandlungsplan für Verletzungen.</p><div class="small muted">Rituale sind Vorschläge, keine Pflicht oder Punktzahl. Lass weg, was sich nicht gut anfühlt.</div></div><h2>Sanfter Reset</h2><div class="list">${tasks.map(([k, label]) => `<div class="listrow"><span class="grow">${label}</span><button class="check ${st[k] ? 'done' : ''}" data-rehab="${k}" aria-label="${label}">${st[k] ? '✓' : '○'}</button></div>`).join('')}</div><div class="card"><b>Bewegung ohne Zusatzbelastung</b><p class="small muted">Optionaler Spaziergang in Plaudertempo oder ein paar Minuten angenehme, schmerzfreie Beweglichkeit. Nicht in Schmerz hinein dehnen; bei zunehmenden Beschwerden abbrechen. Kein Ersatz für Physio oder medizinische Abklärung.</p></div><div class="card"><b>Essen & Trinken</b><p class="small muted">Normale, ausgewogene Mahlzeiten mit einer Proteinquelle und Kohlenhydraten; kein spezielles „Recovery-Food“ nötig. Trink normal nach Durst und ersetze deutliche Schweißverluste – keine erzwungenen Trinkmengen. Für Trainierende sind Gesamtzufuhr und regelmäßige Proteinquellen wichtiger als ein spezielles Timing.</p></div><div class="card"><b>Sauna – nur optional</b><p class="small muted">Kein notwendiger Recovery-Schritt; die Leistungs- und Erholungsbelege sind begrenzt. Wenn du Sauna gewohnt bist und dich gesund fühlst, bleib bei einer kurzen, vertrauten Runde. Geh raus, wenn dir schwindelig, übel oder ungewöhnlich schwach wird. Auslassen bei Krankheit, Fieber oder Dehydrierung; bei Herz-/Blutdruckproblemen, Schwangerschaft oder relevanten Medikamenten vorher medizinisch nachfragen. Kein Alkohol und kein „Aushalten“ als Ziel.</p><button class="outline" data-rehab="sauna">${st.sauna ? 'Sauna notiert ✓' : 'Sauna optional notieren'}</button></div><div class="card"><b>Supplemente</b><p class="small muted">Für Sonntag ist kein zusätzlicher Supplement-Stack nötig. Nimm nichts Neues allein für „Recovery“; wenn du bereits ein Supplement nutzt, bleib bei deinem gewohnten Plan und lass Wechselwirkungen oder Erkrankungen fachlich prüfen. Keine Sonderdosis am Ruhetag.</p></div><section class="section"><h2>Mahlzeiten heute</h2>${mealPanel()}</section><section class="section"><h2>Schlaf & Tagesroutine</h2><div class="small muted" style="margin:0 4px 8px">Für Erwachsene sind mindestens 7 Stunden ein sinnvoller Ausgangspunkt; Schlafbedarf ist individuell. Halte die Schlafenszeit möglichst regelmäßig.</div>${routinePanel(true)}</section><details class="card"><summary style="font-weight:700">Quellen & Einordnung</summary><ul class="small muted"><li><a href="https://pubmed.ncbi.nlm.nih.gov/33144349/" target="_blank" rel="noopener">Schlaf und Athlet:innen: Expertenkonsens</a></li><li><a href="https://link.springer.com/article/10.1186/s12970-017-0177-8" target="_blank" rel="noopener">ISSN-Positionspapier: Protein und Training</a></li><li><a href="https://www.ausport.gov.au/clearinghouse/evidence/sports-performance-recovery" target="_blank" rel="noopener">Australian Institute of Sport: Recovery</a></li><li><a href="https://www.mayoclinicproceedings.org/article/s0025-6196(18)30275-1/fulltext" target="_blank" rel="noopener">Sauna: Review zu Evidenz und Sicherheit</a></li></ul></details><button class="outline" data-go="programm" style="width:100%">Zur Wochenübersicht</button></section>`;
}
function training() {
  let di = Number.isInteger(S.selectedDay) ? S.selectedDay : dow(),
    p = getPlan(di);
  if (p.key === 'rehab') return rehabView(di);
  if (p.key === 'rest') return `<section class="section"><div class="card"><span class="pill">${DAYS[di]}</span><div class="big" style="margin:12px 0">Ruhetag</div><p class="muted">Heute ist frei eingeplant. Eine fehlende Aufzeichnung ist nicht automatisch ein Ruhetag.</p><button class="outline" data-go="programm">Wochenübersicht</button></div></section>`;
  if (p.key === 'long') return runView(p, di);
  if (!isStrengthDay(p)) return strengthView(p, di);
  let top = `<section class="section">${modeCard(di)}</section>`;
  if (dayMode(di) === 'crossfit') return top + crossfitView(p, di) + (p.run ? runView(p, di) : '');
  return top + strengthView(p, di) + (p.run ? runView(p, di) : '');
}
function todayAdvice(p) {
  let yesterday = S.logs.filter(x => x.date === dateAgo(1)),
    heavyYesterday = yesterday.some(x => x.type === 'strength' && ['squat', 'deadlift'].includes(x.key) || x.type === 'crossfit' && x.legs >= 2),
    hardRunYesterday = yesterday.some(x => x.type === 'run' && x.pace > 0 && x.pace < paceToSec(S.pace) - 40),
    runConflict = !!(heavyYesterday && p.run === 'quality'),
    legConflict = !!(hardRunYesterday && p.legs);
  if (!runConflict && !legConflict) return '';
  let text = runConflict ? 'Gestern waren schwere Beine erfasst; heute den Qualitätslauf locker machen.' : 'Gestern war ein harter Lauf erfasst; heute den Beintag leichter gestalten.';
  return `<div class="card"><b class="ember">Heute beachten</b><p class="small">${text}</p><button class="outline" data-advice-light>Leichtere Anpassung aktivieren</button></div>`;
}
function strengthView(p,di) {
  const items=buildDay(di), completed=dayStatus(di).strength, extra=extraChoice(di);
  return `<section class="section"><div class="card"><div class="row start"><div><span class="pill">${DAYS[di]} · ${esc(shortName(p))}</span><h2 style="margin:10px 0 3px">${isDeload()?'Entlastungswoche':S.week===16?'Bilanz & Vergleich':'Kraft mit Fokus'}</h2><p class="small muted">${items.reduce((n,x)=>n+x.prescribedSets,0)} Arbeitssätze · ${isDeload()||S.week===16?'weniger Umfang':'ca. 55–60 Minuten inklusive Aufwärmen'} · ${isDeload()?'3–4':'1–2'} Wiederholungen Reserve</p></div></div><label for="contextPick">Trainingsort</label><select id="contextPick" ${S.session?'disabled':''}>${Object.entries(S.contexts).map(([id,name])=>`<option value="${esc(id)}" ${id===S.contextId?'selected':''}>${esc(name)}</option>`).join('')}</select><div class="tiny muted" style="margin-top:8px">Gewichte werden pro Übungsvariante, Ort und Gerät verglichen.</div></div>${readinessPanel(p)}${todayAdvice(p)}<details class="card"><summary>Aufwärmen & Ablauf</summary><p class="small muted">5–8 Minuten locker bewegen, dann einige zunehmend schwerere Aufwärmsätze für den ersten Hauptlift. Aufwärmsätze zählen nicht zu den Arbeitssätzen. ${p.run?'Kraft und Lauf nach Möglichkeit mit mehreren Stunden Abstand planen.':''}</p><p class="small muted">Pausen: Hauptübungen 2–3 Minuten, Ergänzungen 60–90 Sekunden. Wenn die Zeit knapp wird, den letzten Zusatzblock auslassen und die Einheit als teilweise speichern.</p></details>${extrasPanel(p,di)}<div class="card"><div class="row"><div><b>${completed?'Kraftteil gespeichert':'Deine Übungen'}</b><div class="small muted">${S.contexts[S.contextId] ? esc(S.contexts[S.contextId]) : 'Trainingsort'}</div></div><button class="primary" data-start="${di}">${S.session?'Session fortsetzen':completed?'Weitere Session':'Session starten'}</button></div></div><div class="list">${items.map(x=>`<div class="listrow"><div class="grow"><b>${esc(x.exercise)}</b><div class="small muted">${x.prescribedSets} × ${rangeText(x)} · ${esc(weightText(x.rec.weight,x))}</div><div class="tiny muted">${esc(x.rec.message)}</div></div><button class="outline" data-swap="${esc(x.origin)}" aria-label="${esc(x.exercise)} tauschen">⇄</button></div>`).join('')}</div>${extra==='finisher'?finisherCard(p,di):extra==='tri'?triPanel():''}<div class="actions"><button class="outline" data-move="${di}">Tag verschieben</button></div></section>`;
}
function readinessPanel(p) {
  const r=S.readiness[today()]||{};
  return `<details class="card"><summary>Tagesform ${S.lighter?'· leichter Tag aktiv':''}</summary><div class="formgrid" style="margin-top:10px">${[['sleep','Schlaf'],['legs','Beine'],['energy','Energie']].map(([k,label])=>`<div><label>${label}</label><select data-ready="${k}"><option value="" ${!r[k]?'selected':''}>Noch offen</option><option value="3" ${r[k]===3?'selected':''}>Gut</option><option value="2" ${r[k]===2?'selected':''}>Okay</option><option value="1" ${r[k]===1?'selected':''}>Schlecht</option></select></div>`).join('')}</div><p class="small muted">Ein leichter Tag reduziert die Arbeitssätze und macht den Qualitätslauf locker. Wähle das Gewicht passend zu deiner Tagesform.</p><button class="outline" data-easyday>${S.lighter?'Leichter-Modus aus':'Heute leichter machen'}</button></details>`;
}
function sleepAverage() {
  let vals = S.sleep.filter(x => x.date >= dateAgo(6)).map(x => x.hours);
  return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) + ' h' : '—';
}
function triPanel() {
  const di=Number.isInteger(S.selectedDay)?S.selectedDay:dow(),strength=S.logs.slice().reverse().find(l=>samePlanDay(l,di)&&l.type==='strength'),already=S.logs.some(l=>samePlanDay(l,di)&&l.type==='accessory'&&l.tri),ready=strength&&strength.extra==='tri'&&strength.closed!==false&&strength.duration<=42;
  return `<div class="card"><span class="pill">Optional · Upper</span><h3>6-12-25</h3><p class="small muted">Zwei Runden mit drei Übungen: 6, 12 und 25 Wiederholungen. 15 Sekunden beim Wechsel, 3 Minuten zwischen den Runden. Diese sechs Sätze ersetzen Klimmzüge, Rudern und Core im normalen Freitagsteil.</p><label for="triGroup">Fokus</label><select id="triGroup"><option value="shoulders">Schultern</option><option value="back">Rücken</option></select><p class="small muted">${already?'Heute bereits gespeichert.':!strength?'Zuerst Bankdrücken und Bizeps abschließen.':!ready?'Für heute ausgesetzt: Der Kraftteil lässt weniger als 18 Minuten Zeit.':'Gewichte passend zur Wiederholungszahl wählen. Kein zusätzlicher Finisher.'}</p><button class="primary" data-tri ${!ready||already?'disabled':''}>6-12-25 starten</button></div>`;
}
function startTri(group) {
  const day=Number.isInteger(S.selectedDay)?S.selectedDay:dow(),p=getPlan(day),strength=S.logs.slice().reverse().find(l=>samePlanDay(l,day)&&l.type==='strength');
  if(S.session||S.wodRun||S.tri?.active){toast('Bitte die begonnene Einheit zuerst abschließen.');return;}
  if(p.key!=='upper'||extraChoice(day)!=='tri'||!strength||strength.extra!=='tri'||strength.closed===false||strength.duration>42||S.logs.some(l=>samePlanDay(l,day)&&l.tri)){toast('6-12-25 ist nach dem dafür verkürzten Freitagsteil verfügbar.');return;}
  const groups={shoulders:[['Overhead Press',6,'shoulders'],['DB Lateral Raise',12,'shoulders'],['Face Pull',25,'shoulders']],back:[['Klimmzüge strikt',6,'back'],['Chest-Supported Row',12,'back'],['Face Pull',25,'shoulders']]};
  const items=Array.from({length:2},(_,round)=>(groups[group]||groups.shoulders).map(([name,reps,muscle])=>({name,reps,muscle,round:round+1,kg:null,actualReps:null,done:false}))).flat();
  S.tri.active={logId:DATA.uid('tri'),legacy:false,group,day,week:S.week,cycle:S.cycle,contextId:S.contextId,date:today(),idx:0,started:Date.now(),activeMs:0,segmentStart:Date.now(),paused:false,items};S.tab='training';save();render();
}
function triRunView() {
  const a=S.tri.active,x=a.items[a.idx],meta=TRAIN.exercise(x.name),count=a.items.filter(x=>x.done).length;
  return `<section class="section"><div class="row"><button class="outline" data-tri-exit>Pausieren</button><span class="small muted">6-12-25 · <span id="sessionElapsed">${fmtSec(activeMilliseconds(a)/1000)}</span></span><button class="outline" data-tri-finish>Speichern</button></div><div class="session-head"><div class="row"><b>${esc(x.name)}</b><span class="meter">${a.idx+1}/6</span></div><div class="bar"><i style="width:${count/6*100}%"></i></div></div><div class="card"><span class="pill">Runde ${x.round}/2</span><div class="big" style="margin:12px 0">${x.reps}<small style="font-size:16px"> Wdh. Ziel</small></div><p class="small muted">${esc(meta.weightNote)}</p>${meta.weightMode==='bodyweight'?'':`<label for="triWeight">${meta.weightMode==='added'?'Zusatzgewicht':'Gewicht'} (kg)</label><input id="triWeight" type="number" min="0" max="1500" step="0.25" value="${x.kg??''}">`}<label for="triReps">Tatsächliche Wiederholungen</label><input id="triReps" type="number" min="1" max="250" value="${x.actualReps??''}" placeholder="${x.reps}"><button class="primary" data-tri-check style="margin-top:12px;width:100%">${x.done?'Satz wieder öffnen':'Satz bestätigen'}</button></div><div class="card"><div class="row"><b>Pause</b><span class="meter" id="timer" role="timer">0:15</span></div><div class="actions"><button class="outline" data-tri-rest>15 Sekunden</button><button class="outline" data-tri-roundrest>3 Minuten</button></div></div><div class="actions"><button class="outline" data-tri-prev ${a.idx===0?'disabled':''}>Zurück</button><button class="primary" data-tri-next>${a.idx===5?'Speichern':'Weiter'}</button>${!count?'<button class="outline" data-discard-tri>Leeren Entwurf verwerfen</button>':''}</div></section>`;
}
function finishTri() {
  const a=S.tri.active;if(!a)return;const count=a.items.filter(x=>x.done).length;if(!count){toast('Bitte zuerst einen tatsächlichen Satz bestätigen.');return;}
  if(count<6&&!confirm(`6-12-25 mit ${count}/6 Sätzen abschließen?`))return;
  pauseActive();
  const record={id:a.logId||DATA.uid('tri'),date:a.date||today(),week:a.week||S.week,cycle:a.cycle||S.cycle,muscle:a.group,setCount:count,items:a.items.map(x=>({...x}))};
  S.tri.sessions=DATA.upsertLog(S.tri.sessions,record);
  const duration=Math.max(.1,Math.round(activeMilliseconds(a)/6000)/10);
  S.logs=DATA.upsertLog(S.logs,{id:record.id,type:'accessory',legacy:!!a.legacy,tri:true,name:'6-12-25 · '+(a.group==='back'?'Rücken':'Schultern'),date:record.date,week:record.week,cycle:record.cycle,day:a.day??4,duration,load:duration*(S.loadFactors.normal??.7),contextId:a.contextId||S.contextId,setCount:count});
  S.tri.lastWeek=record.week;S.tri.lastMuscle=a.group;S.tri.active=null;save();render();toast('6-12-25 gespeichert · zählt zur Trainingsbelastung');
}
function runView(p,di) {
  const kind=p.run, target=S.runTargets[kind], done=dayStatus(di).run;
  const advice = kind==='quality' && !S.lighter && !isDeload() && S.week!==16 ? 'Wähle einen vertrauten Reiz: z. B. nach dem Einlaufen 4 × 2 Minuten kontrolliert zügig mit je 2 Minuten locker. Bei müden Beinen die gesamte Strecke locker laufen.' : 'Locker im Gesprächstempo. Die Distanz ist dein persönliches Ziel und wird nicht automatisch erhöht.';
  return `<section class="section"><div class="card"><span class="pill">${DAYS[di]} · ${kind==='long'?'Long Run':kind==='quality'?'Quality Run':'Easy Run'} ${done?'· gespeichert ✓':''}</span><div class="big" style="margin:12px 0">${target}<small style="font-size:16px"> km Ziel</small></div><p class="small muted">${advice}</p><p class="tiny muted">${kind==='quality'?'Kein automatisch berechnetes Intervalltempo.':`Dein Tempo-Anker: ${esc(S.pace)} min/km; Tagesform und Gesprächstempo gehen vor.`} Laufziele kannst du im Setup ändern.</p><div class="formgrid"><div><label for="runDist">Tatsächliche Strecke (km)</label><input id="runDist" type="number" min="0.1" max="250" step="0.1" placeholder="${target}"></div><div><label for="runTime">Tatsächliche Zeit (hh:mm:ss oder Min.)</label><input id="runTime" placeholder="00:32:30" inputmode="decimal"></div></div><div class="actions"><button class="primary" data-save-run="${di}">Lauf speichern</button><button class="outline" data-easyday>${S.lighter?'Leichter-Modus aus':'Heute locker / kürzer'}</button></div></div></section>`;
}
function startSession(day) {
  if (S.session) { if (!S.session.paused) return; S.session.paused=false; S.session.segmentStart=Date.now(); S.tab='training'; save(); render(); return; }
  if (S.wodRun || S.tri?.active) { toast('Bitte das begonnene Training zuerst fortsetzen oder abschließen.'); return; }
  const p=getPlan(day); if (!isStrengthDay(p) || dayMode(day)==='crossfit') return;
  S.session={id:DATA.uid('strength'),legacy:false,day,week:S.week,cycle:S.cycle,date:today(),key:p.key,name:p.name,contextId:S.contextId,extra:extraChoice(day),started:Date.now(),activeMs:0,segmentStart:Date.now(),paused:false,idx:0,restEnd:null,readiness:S.readiness[today()]||null,items:buildDay(day).map(item=>({...item,sets:Array.from({length:item.prescribedSets},()=>({kg:item.rec.weight,reps:null,seconds:null,done:false})),rir:null}))};
  S.tab='training'; S.selectedDay=day; save(); render(); window.scrollTo?.(0,0);
}
function sessionView() {
  const s=S.session, x=s.items[s.idx], meta=TRAIN.exercise(x.exercise), done=s.items.reduce((n,e)=>n+e.sets.filter(a=>a.done).length,0), all=s.items.reduce((n,e)=>n+e.sets.length,0);
  const last=TRAIN.getLastPerformance(S.logs.filter(l=>l.id!==s.id),{exerciseId:x.id,contextId:s.contextId,deviceId:x.deviceId});
  const lastText=last?`${last.date} · ${last.sets.map(a=>setText(a,x)).join(' / ')}`:'Noch keine vergleichbaren Sätze für diese Variante an diesem Gerät.';
  return `<section class="section"><div class="row"><button class="outline" data-session-exit>Pausieren</button><span class="small muted">${DAYS[s.day]} · <span id="sessionElapsed">${fmtSec(activeMilliseconds(s)/1000)}</span></span><button class="outline" data-finish-session>Speichern</button></div><div class="session-head"><div class="row"><span class="small muted">${done}/${all} Sätze</span><span class="meter">${s.idx+1}/${s.items.length}</span></div><div class="bar"><i style="width:${done/all*100}%"></i></div></div>${s.legacy?'<div class="card context-notice small">Fortgesetzte Einheit aus der alten Version. Die Werte bleiben erhalten; sie lösen keine automatische Gewichtssteigerung aus.</div>':''}<div class="card"><div class="row"><div class="grow"><span class="pill">${esc(x.muscle)}</span><h2 style="margin:8px 0">${esc(x.exercise)}</h2></div><button class="outline" data-session-swap>Tauschen</button></div><b>${x.sets.length} × ${rangeText(x)}</b><p class="small">${esc(x.unit==='seconds'?'Halte die Position sauber und erfasse die tatsächlichen Sekunden.':x.rec?.kind==='new'?'Wähle dein Startniveau mit etwa 2 Wiederholungen Reserve.':x.rec?.message||'Erfasse deine tatsächlichen Sätze.')}</p><details class="small"><summary>Technik & letzte Leistung</summary><p class="muted">${esc(meta.cue)}</p><p class="muted">${esc(lastText)}</p></details><button class="outline" data-device style="margin-top:10px">Gerät & Gewichtsschritt</button><div class="tiny muted" style="margin-top:8px">${esc(S.contexts[s.contextId]||s.contextId)} · ${esc(x.deviceId==='standard'?'Standardgerät':x.deviceId)}</div></div><div class="card"><div class="row"><b>Deine Arbeitssätze</b><span class="small muted">${x.unit==='seconds'?'Sekunden':'Wiederholungen'}</span></div><p class="tiny muted">${esc(meta.weightNote)}${meta.perSide?' Wiederholungen gelten je Seite.':''} Vorschläge sind keine erledigten Sätze.</p>${x.sets.map((a,i)=>`<div class="sets">${x.weightMode!=='bodyweight'?`<input type="number" min="0" max="1500" step="0.25" inputmode="decimal" aria-label="Satz ${i+1} ${x.weightMode==='assistance'?'Unterstützung':'Gewicht'} in kg" data-skg="${i}" value="${a.kg??''}" placeholder="kg">`:'<span class="tiny muted">Körpergewicht</span>'}<input type="number" min="1" max="${x.unit==='seconds'?3600:250}" inputmode="numeric" aria-label="Satz ${i+1} ${x.unit==='seconds'?'Sekunden':'Wiederholungen'}" data-srep="${i}" value="${(x.unit==='seconds'?a.seconds:a.reps)??''}" placeholder="${x.min}–${x.max}"><span class="small muted">${i+1}</span><button class="check ${a.done?'done':''}" data-sdone="${i}" aria-label="Satz ${i+1} ${a.done?'wieder öffnen':'bestätigen'}">${a.done?'✓':'○'}</button></div>`).join('')}${x.unit==='seconds'?'<p class="tiny muted">Saubere Haltezeit statt Wiederholungsreserve. Für diese Variante wird kein Kilogrammgewicht vorgeschlagen.</p>':`<label for="rirInput" style="margin-top:14px">Reserve im letzten Arbeitssatz (RIR)</label><select id="rirInput"><option value="" ${x.rir==null?'selected':''}>Noch nicht angegeben</option>${[0,1,2,3,4].map(n=>`<option value="${n}" ${x.rir===n?'selected':''}>${n===4?'4 oder mehr':n} weitere saubere Wiederholungen</option>`).join('')}</select><p class="tiny muted">Ohne Angabe bleibt der Gewichtsvorschlag unverändert.</p>`}</div><div class="card"><div class="row"><b>Satzpause</b><span class="meter" id="timer" role="timer">${fmtSec(x.rest||S.pause)}</span></div><div class="actions"><button class="primary" data-timer>Pause starten</button><button class="outline" data-plus15>+15 s</button><button class="outline" data-skip>Beenden</button></div></div><div class="actions"><button class="outline" data-prev-ex ${s.idx===0?'disabled':''}>Zurück</button><button class="primary" data-next-ex>${s.idx===s.items.length-1?'Einheit speichern':'Nächste Übung'}</button></div>${!done?'<button class="outline" data-discard-session>Leeren Entwurf verwerfen</button>':''}<p class="tiny muted">Die Zeit pausiert, wenn die App in den Hintergrund geht. Beim Speichern kannst du die tatsächliche Dauer korrigieren.</p></section>`;
}
function elapsed(t) {
  let n = Math.max(0, Math.floor((Date.now() - t) / 1000));
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
}
function plateString(total) {
  let a = Math.max(0, (total - 20) / 2),
    out = [];
  [25, 20, 15, 10, 5, 2.5, 1.25].forEach(p => {
    let n = Math.floor(a / p);
    if (n) {
      out.push(`${n}×${p}`);
      a -= n * p;
    }
  });
  return out.length ? out.join(' + ') + ' kg' : 'keine Scheiben';
}
function finishSession() {
  const s=S.session; if (!s) return;
  const count=s.items.reduce((n,x)=>n+x.sets.filter(a=>a.done).length,0), total=s.items.reduce((n,x)=>n+x.sets.length,0);
  if (!count) { toast('Bestätige zuerst mindestens einen tatsächlich ausgeführten Satz.'); return; }
  pauseActive();
  openSheet(`<h2 class="sheet-title">Training speichern</h2><p class="small muted">${count}/${total} Sätze bestätigt. ${count<total?'Du kannst den Teilstand speichern und später fortsetzen.':'Alle geplanten Sätze sind erfasst.'}</p><label for="sessionMinutes">Tatsächliche Trainingsdauer (Minuten)</label><input id="sessionMinutes" type="number" min="0.1" max="240" step="0.1" value="${Math.max(.1,Math.round(activeMilliseconds(s)/6000)/10)}"><div class="actions"><button class="primary" data-confirm-session>${count<total?'Teilstand speichern':'Einheit abschließen'}</button>${count<total?'<button class="outline" data-end-partial>Mit diesen Sätzen abschließen</button>':''}<button class="outline" data-close>Zurück</button></div>`);
  const commit=close=>{
    const duration=Number(document.getElementById('sessionMinutes').value);
    if (!(duration>0&&duration<=240)) { toast('Bitte eine Dauer zwischen 0,1 und 240 Minuten eintragen.'); return; }
    commitSession(duration,close); document.getElementById('sheet')?.remove(); render();
    toast(close?'Kraftteil gespeichert':'Teilstand gespeichert – deine Session bleibt fortsetzbar');
  };
  document.querySelector('[data-confirm-session]').onclick=()=>commit(count===total);
  document.querySelector('[data-end-partial]')?.addEventListener('click',()=>commit(true));
  // Cancel keeps the draft paused and available rather than losing any sets.
}
function suggestWeights() { S.pendingSuggestion = null; }
function bindTri() {
  const a=S.tri.active;if(!a)return;const item=()=>a.items[a.idx];
  document.getElementById('triWeight')?.addEventListener('input',e=>{item().kg=e.target.value===''?null:Number(e.target.value);item().done=false;save();});
  document.getElementById('triReps')?.addEventListener('input',e=>{item().actualReps=e.target.value===''?null:Number(e.target.value);item().done=false;save();});
  document.querySelector('[data-tri-check]')?.addEventListener('click',()=>{const x=item(),meta=TRAIN.exercise(x.name);if(!x.done&&!validActualSet({kg:x.kg,reps:x.actualReps},meta)){toast('Bitte tatsächliche Wiederholungen und Gewicht eintragen.');return;}x.done=!x.done;save();render();if(x.done)timerStart(a.items[a.idx+1]?.round!==x.round?180:15);});
  document.querySelector('[data-tri-next]')?.addEventListener('click',()=>{if(a.idx===5)finishTri();else{a.idx++;save();render();}});
  document.querySelector('[data-tri-prev]')?.addEventListener('click',()=>{a.idx=Math.max(0,a.idx-1);save();render();});
  document.querySelector('[data-tri-finish]')?.addEventListener('click',finishTri);
  document.querySelector('[data-tri-exit]')?.addEventListener('click',()=>{pauseActive();save();render();});
  document.querySelector('[data-tri-rest]')?.addEventListener('click',()=>timerStart(15));
  document.querySelector('[data-tri-roundrest]')?.addEventListener('click',()=>timerStart(180));
  document.querySelector('[data-discard-tri]')?.addEventListener('click',()=>{if(!a.items.some(x=>x.done)&&confirm('Leeren Tri-Set-Entwurf verwerfen?')){S.tri.active=null;save();render();}});
}
function bindSession() {
  const s=S.session; if (!s) return;
  const current=()=>s.items[s.idx];
  document.querySelectorAll('[data-skg]').forEach(el=>el.oninput=()=>{
    const a=current().sets[Number(el.dataset.skg)]; a.kg=el.value===''?null:Number(el.value); a.done=false; save();
    const button=document.querySelector(`[data-sdone="${el.dataset.skg}"]`); if (button) {button.textContent='○';button.classList.remove('done');}
  });
  document.querySelectorAll('[data-srep]').forEach(el=>el.oninput=()=>{
    const x=current(), a=x.sets[Number(el.dataset.srep)]; a[x.unit==='seconds'?'seconds':'reps']=el.value===''?null:Number(el.value); a.done=false; save();
    const button=document.querySelector(`[data-sdone="${el.dataset.srep}"]`); if (button) {button.textContent='○';button.classList.remove('done');}
  });
  document.querySelectorAll('[data-sdone]').forEach(el=>el.onclick=()=>{
    const x=current(),a=x.sets[Number(el.dataset.sdone)];
    if (!a.done && !validActualSet(a,x)) {toast('Bitte tatsächliche Wiederholungen bzw. Sekunden und ein passendes Gewicht eingeben.');return;}
    a.done=!a.done; save(); render(); if(a.done) timerStart(x.rest||S.pause);
  });
  document.getElementById('rirInput')?.addEventListener('change',e=>{current().rir=e.target.value===''?null:Number(e.target.value);save();});
  document.querySelector('[data-finish-session]')?.addEventListener('click',finishSession);
  document.querySelector('[data-next-ex]')?.addEventListener('click',()=>{if(s.idx===s.items.length-1)finishSession();else{s.idx++;save();render();window.scrollTo?.(0,0);}});
  document.querySelector('[data-prev-ex]')?.addEventListener('click',()=>{s.idx=Math.max(0,s.idx-1);save();render();window.scrollTo?.(0,0);});
  document.querySelector('[data-session-exit]')?.addEventListener('click',()=>{pauseActive();s.restEnd=null;save();render();});
  document.querySelector('[data-session-swap]')?.addEventListener('click',()=>openSwap(current().origin));
  document.querySelector('[data-device]')?.addEventListener('click',deviceSheet);
  document.querySelector('[data-discard-session]')?.addEventListener('click',()=>{if(!s.items.some(x=>x.sets.some(a=>a.done))&&confirm('Leeren Trainingsentwurf verwerfen?')){S.session=null;save();render();}});
  document.querySelector('[data-plus15]')?.addEventListener('click',()=>{const owner=timerOwner();timerStart(Math.max(0,((owner?.restEnd||Date.now())-Date.now())/1000)+15);});
  document.querySelector('[data-skip]')?.addEventListener('click',()=>timerStart(0));
  document.querySelector('[data-timer]')?.addEventListener('click',()=>timerStart(current().rest||S.pause));
}
let timerId;
function timerStart(sec) {
  const owner=timerOwner(); if(!owner)return;
  owner.restEnd=sec>0?Date.now()+sec*1000:null; save(); restoreRestTimer();
}
function history() {
  let sessions = S.logs.filter(x => x.type === 'strength'),
    cfCount = S.logs.filter(x => x.type === 'crossfit').length,
    finCount = S.logs.filter(x => x.type === 'metcon').length,
    runs = S.logs.filter(x => x.type === 'run'),
    ton = sessions.reduce((a, x) => a + (Number(x.volume) || 0), 0),
    days = new Set(S.logs.map(x => x.date));
  let streak = 0,
    d = new Date();
  for (let i = 0; i < 366; i++) {
    if (days.has(dateKey(d))) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  let monday = weekStart(new Date()),
    weeks = Array.from({
      length: 8
    }, (_, i) => {
      let start = addDays(monday, (i - 7) * 7),
        end = addDays(start, 6),
        value = S.logs.filter(x => x.type === 'strength' && x.date >= dateKey(start) && x.date <= dateKey(end)).reduce((n, x) => n + (Number(x.volume) || 0), 0);
      return {
        label: dateKey(start).slice(5),
        value
      };
    });
  return `<section class="section"><div class="grid"><div class="metric"><span class="muted">Krafteinheiten</span><b>${sessions.length}</b><span class="tiny muted">${cfCount} CrossFit · ${finCount} Finisher</span></div><div class="metric"><span class="muted">Läufe</span><b>${runs.length}</b></div><div class="metric"><span class="muted">Tonnage gesamt</span><b>${Math.round(ton)} kg</b></div><div class="metric"><span class="muted">Serie</span><b>${streak} T.</b></div></div></section><section class="section"><h2>Wochentonnage</h2><div class="card"><div class="chart">${chartBars(weeks)}</div><div class="small muted">Kraft-kg aus protokollierten Sätzen, ohne Laufkilometer zu addieren.</div></div></section><section class="section"><h2>Bestleistungen</h2><div class="list">${bestLifts().map(x => `<div class="listrow"><div class="grow"><b>${esc(x.name)}</b><div class="small muted">${esc(x.date)}</div></div><b>${x.value} kg e1RM*</b></div>`).join('') || '<div class="listrow muted">Noch keine gespeicherten Bestleistungen</div>'}</div><p class="tiny muted">* Geschätzt nach Epley aus deinen protokollierten Sätzen.</p></section><section class="section"><h2>Letzte Einheiten</h2><div class="list">${S.logs.slice(-20).reverse().map((x, i) => `<div class="listrow"><div class="grow"><b>${esc(x.name || x.type)}</b><div class="small muted">${esc(x.date)}${x.legacy?' · Altbestand':''}${x.status==='partial'?' · teilweise':''} · ${x.type === 'run' ? `${x.distance} km · ${secToPace(x.pace)} /km` : x.type === 'strength' ? `${Math.round(x.volume || 0)} kg Volumen` : x.type === 'crossfit' || x.type === 'metcon' ? `${esc(x.result || '')} · ${esc(x.duration || 0)} Min.` : esc(x.duration || '')} </div></div><button class="outline" data-edit-log="${esc(x.id)}">Ändern</button></div>`).join('') || '<div class="listrow muted">Noch keine Einheiten gespeichert</div>'}</div></section>`;
}
function weekNum(date) {
  let d = new Date(date + 'T12:00:00');
  return Math.floor((d - new Date(d.getFullYear(), 0, 1)) / 604800000);
}
function chartBars(arr) {
  let max = Math.max(1, ...arr.map(x => x.value));
  return arr.map(x => `<div class="col"><i style="height:${Math.max(4, x.value / max * 75)}px"></i><span>${esc(x.label)}</span></div>`).join('');
}
function bestLiftsLegacy() {
  let a = [];
  S.logs.forEach(l => (l.prs || []).forEach(p => a.push({
    name: p.exercise,
    value: p.estimated1RM,
    date: l.date
  })));
  let m = {};
  a.forEach(x => {
    if (!m[x.name] || x.value > m[x.name].value) m[x.name] = x;
  });
  return Object.values(m);
}
function analysis() {
  let series42 = dailySeries(42),
    series28 = dailySeries(28),
    series7 = dailySeries(7),
    observed = series42.filter(x => x.load !== null).map(x => x.load),
    anchor = Math.max(40, percentile(observed, .95)),
    fitness = dailyEWMA(series42, 42),
    fatigue = dailyEWMA(series7, 7),
    latest = series42.slice().reverse().find(x => x.load !== null),
    load7 = series7.reduce((n, x) => n + (x.load || 0), 0),
    load28 = series28.reduce((n, x) => n + (x.load || 0), 0),
    ratio = load28 ? load7 / (load28 / 4) : null,
    above = observed.length ? observed.filter(x => x > anchor).length / observed.length * 100 : 0,
    weekly = weeklyTotals(),
    gap = daysMissing(),
    run = runAnalysis(),
    note = analysisFinding(weekly),
    missing42 = series42.filter(x => x.load === null).length;
  return `<section class="section"><div class="grid"><div class="metric" data-math="load"><span class="muted">Tageslast zuletzt</span><b>${Math.round(latest?.load || 0)}</b></div><div class="metric" data-math="anchor"><span class="muted">95%-Anker</span><b>${Math.round(anchor)}</b></div><div class="metric" data-math="fitness"><span class="muted">Lasttrend · 42 T.</span><b>${Math.round(fitness.value)}</b></div><div class="metric" data-math="fatigue"><span class="muted">Lasttrend · 7 T.</span><b>${Math.round(fatigue.value)}</b></div></div><div class="card"><div class="row"><span>Trenddifferenz</span><b>${Math.round(fitness.value - fatigue.value)}</b></div><div class="small muted">Rechenmodell aus erfassten Einträgen, keine Messung von Fitness oder Ermüdung; Lücken werden nicht als Ruhetage behandelt. ${fitness.seen < 42 ? 'Einschwingen: weniger als 42 Tage Daten.' : ''} Fehlende Tage: ${gap} ohne Eintrag; nicht als Ruhe gewertet.</div></div><div class="card"><b>Belastungsverhältnis 7:28</b><p class="small muted">${ratio === null ? 'Keine erfasste Last im 28-Tage-Fenster' : ratio.toFixed(2)} · umstrittene Kennzahl; 7-Tage-Last ${Math.round(load7)}, 28-Tage-Last ${Math.round(load28)}.</p><span class="small muted">95%-Anker ${Math.round(anchor)}; ${above.toFixed(0)} % der protokollierten Tage darüber. ${above > 10 ? 'Mehr als 10 % überschreiten den Anker – Skalierung prüfen.' : 'Nicht bei 100 gedeckelt.'}</span></div></section><section class="section"><h2>Wochenvergleich</h2><div class="card"><div class="chart">${chartBars(weekly.slice(-8).map(x => ({
    label: x.label.slice(0, 5),
    value: x.km
  })))}</div>${weekly.slice(-4).map(x => `<div class="listrow"><span>${x.label}</span><b>${x.km.toFixed(1)} km</b><span class="small ${Math.abs(x.change || 0) >= 30 ? 'ember' : 'muted'}">${x.change === null ? '—' : (x.change > 0 ? '+' : '') + x.change.toFixed(0) + '%'}</span></div>`).join('')}<p class="tiny muted">Sprung ab 30 % markiert; Wochen unter 30 km von der Sprungwertung ausgenommen.</p></div></section><section class="section"><h2>Ein Befund</h2><div class="card summary">${note}</div></section><section class="section"><h2>VDOT, Tempozonen & Prognose</h2><div class="card">${run.best ? `<div class="row"><b>VDOT · ${run.best.date}</b><span class="meter">${run.best.vdot.toFixed(1)}</span></div><p class="small muted">Höchster Daniels-VDOT aus deinen eingetragenen Läufen: ${run.best.distance} km in ${durationText(run.best.duration * 60)}.</p><h3>Trainingszonen</h3>${run.zones.map((z, i) => `<div class="listrow"><div class="grow"><b>${z.name}</b><div class="small muted">${secToPace(z.fast)}–${secToPace(z.slow)} min/km</div></div><span>${run.zoneShares[i].share.toFixed(0)} %</span></div>`).join('')}<h3 style="margin-top:14px">Prognose Riegel / Daniels</h3>${run.predictions.map(x => `<div class="listrow"><span>${x.distance === 5 ? '5 km' : x.distance === 10 ? '10 km' : x.distance < 22 ? 'Halbmarathon' : 'Marathon'}</span><span class="small">${durationText(x.riegel)} / ${durationText(x.daniels)}</span></div>`).join('')}` : '<p class="muted">VDOT, Zonen und Prognosen brauchen einen gespeicherten Lauf mit Strecke und Zeit.</p>'}<p class="tiny muted">VDOT und Zonen sind Näherungen aus Daniels-Formeln; Prognosen nach Riegel und Daniels sind Modellwerte, keine Zusage.</p></div></section><section class="section"><h2>Muskelgruppen · 7 Tage</h2><div class="list">${muscleVolume().map(([k, n]) => `<div class="listrow"><span>${esc(k)}</span><b>${n} Sätze</b></div>`).join('')}</div><p class="tiny muted">Orientierung je Muskelgruppe ist individuell; Satzzuordnung hier näherungsweise.</p></section><section class="section"><h2>Ehrlichkeitscheck</h2><div class="card small">Einheiten gesamt: ${S.logs.length} · Pulsdaten: ${S.logs.filter(x => x.hr).length} · Pulsverlauf pro Sekunde: nicht erfasst · Lücken ohne Eintrag: ${gap}. Fehlende Aufzeichnung ist nicht gleich Ruhe.</div></section><section class="section"><h2>Einheiten bearbeiten</h2><div class="list">${S.logs.slice(-24).map((x, i) => {
    let index = Math.max(0, S.logs.length - 24) + i;
    return `<div class="listrow"><div class="grow"><b>${esc(x.name || x.type)}</b><div class="small muted">${esc(x.date)}${x.legacy?' · Altbestand':''}${x.status==='partial'?' · teilweise':''} · ${x.type === 'run' ? `${x.distance} km · ${durationText((x.duration || 0) * 60)}` : x.type === 'rest' ? 'Ruhetag' : `${x.duration || 0} min`}</div></div><button class="outline" data-edit-log="${esc(x.id)}">Ändern</button></div>`;
  }).reverse().join('') || '<div class="listrow muted">Noch keine Einträge.</div>'}</div></section><section class="section"><h2>Analyse anpassen</h2><div class="card"><div class="formgrid"><div><label>Datum</label><input id="manualDate" type="date" value="${today()}"></div><div><label>Art</label><select id="manualType"><option value="run">Lauf</option><option value="strength">Kraft</option><option value="bike">Rad</option><option value="other">Anderes</option></select></div><div><label>Dauer (Min.)</label><input id="manualDuration" type="number" min="0"></div><div><label>Strecke (km)</label><input id="manualDistance" type="number" min="0" step="0.1"></div></div><div class="actions"><button class="primary" data-add-manual>Einheit nachtragen</button><button class="outline" data-csv>CSV importieren</button><input id="csvfile" class="hidden" type="file" accept=".csv,text/csv"></div><div class="small muted">CSV erkennt gängige Garmin-/Strava-Felder, Komma-Dezimalwerte und Zeiten (hh:mm:ss); Dubletten werden nach Aktivitätsart, Datum, Dauer, Distanz und vorhandener Identität erkannt.</div></div><div class="card"><b>Letzte 3 Tage</b><p class="small muted">${gap ? `${gap} Tag(e) ohne Eintrag. Bitte Daten prüfen – fehlende Aufzeichnung wird nicht als Ruhe gewertet.` : 'Alle drei letzten Tage haben Einträge.'}</p><div class="actions">${[0, 1, 2].map(i => {
    let d = dateAgo(i),
      exists = S.logs.some(l => l.date === d);
    return exists ? `<span class="pill">${d} · erfasst</span>` : `<button class="outline" data-restday="${d}">${d} als Ruhetag markieren</button>`;
  }).join('')}</div></div></section>`;
}
function percentile(a, p) {
  if (!a.length) return 0;
  let b = [...a].sort((x, y) => x - y);
  return b[Math.min(b.length - 1, Math.floor((b.length - 1) * p))];
}
function ewma(a, period) {
  if (!a.length) return 0;
  let alpha = 2 / (period + 1),
    v = 0;
  a.forEach(x => v = alpha * x + (1 - alpha) * v);
  return v;
}
function weekStart(d) {
  let x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - (x.getDay() + 6) % 7);
  return x;
}
function addDays(d, n) {
  let x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function weeklyTotals() {
  let monday = weekStart(new Date());
  return Array.from({
    length: 12
  }, (_, i) => {
    let offset = i - 11,
      start = addDays(monday, offset * 7),
      end = addDays(start, 6),
      a = dateKey(start),
      b = dateKey(end),
      km = S.logs.filter(l => l.type === 'run' && l.date >= a && l.date <= b).reduce((n, x) => n + (Number(x.distance) || 0), 0),
      prior = [];
    for (let k = offset - 4; k < offset; k++) {
      let ps = addDays(monday, k * 7),
        pe = addDays(ps, 6),
        pkm = S.logs.filter(l => l.type === 'run' && l.date >= dateKey(ps) && l.date <= dateKey(pe)).reduce((n, x) => n + (Number(x.distance) || 0), 0);
      if (pkm >= 30) prior.push(pkm);
    }
    let avg = prior.length ? prior.reduce((n, v) => n + v, 0) / prior.length : null;
    return {
      label: `${a.slice(5)}–${b.slice(5)}`,
      start: a,
      end: b,
      km,
      prior: avg,
      priorCount: prior.length,
      change: km >= 30 && avg !== null ? (km / avg - 1) * 100 : null
    };
  });
}
function activityLoad(l) {
  if (Number.isFinite(+l.load) && l.load > 0) return +l.load;
  if (l.type === 'rest') return 0;
  if (l.type === 'run' && l.distance && l.pace) return (Number(l.duration) || 0) * (paceToSec(S.pace) / l.pace) ** 2;
  let factor = Number(S.loadFactors?.normal) || .7;
  return (Number(l.duration) || 0) * factor;
}
function dailySeries(days) {
  let map = {};
  S.logs.forEach(l => {
    map[l.date] = (map[l.date] || 0) + activityLoad(l);
  });
  let out = [];
  for (let i = days - 1; i >= 0; i--) {
    let date = dateAgo(i);
    out.push({
      date,
      load: Object.prototype.hasOwnProperty.call(map, date) ? map[date] : null
    });
  }
  return out;
}
function dailyEWMA(series, period) {
  let alpha = 2 / (period + 1),
    v = 0,
    seen = 0;
  series.forEach(x => {
    if (x.load !== null) {
      v = alpha * x.load + (1 - alpha) * v;
      seen++;
    }
  });
  return {
    value: v,
    seen
  };
}
function analysisFinding(ws) {
  let x = ws.slice().reverse().find(a => a.change !== null && Math.abs(a.change) >= 30);
  if (x) {
    let direction = x.change > 0 ? 'Anstieg' : 'Rückgang',
      action = x.change > 0 ? 'Nächste Woche den Laufumfang nicht weiter steigern und die Erholung beobachten.' : 'Nächste Woche keine sprunghafte Aufholsteigerung; Umfang schrittweise nach Gefühl wieder aufbauen.';
    return `<b>${direction} im Laufumfang (${x.start} bis ${x.end})</b><p>${x.km.toFixed(1)} km diese Woche; Mittel der ${x.priorCount} vergleichbaren Vorwochen: ${x.prior.toFixed(1)} km; Veränderung: ${x.change > 0 ? '+' : ''}${x.change.toFixed(0)} %.</p><p>${action}</p>`;
  }
  return 'Kein auffälliger Sprung von mindestens 30 % in einer Laufwoche ab 30 km gegenüber den verfügbaren Vorwochen. Die Richtung wurde auf Zu- und Abnahmen geprüft.';
}
function danielsVDOT(distanceKm, seconds) {
  let t = seconds / 60,
    v = distanceKm * 1000 / t,
    vo2 = -4.6 + .182258 * v + .000104 * v * v,
    f = .8 + .1894393 * Math.exp(-.012778 * t) + .2989558 * Math.exp(-.1932605 * t);
  return vo2 / f;
}
function speedAtVO2(vo2) {
  return (-.182258 + Math.sqrt(.182258 ** 2 + 4 * .000104 * (vo2 + 4.6))) / (2 * .000104);
}
function vdotZones(vdot) {
  return [['Easy', .59, .74], ['Marathon', .75, .84], ['Threshold', .83, .88], ['Interval', .95, 1], ['Repetition', 1.05, 1.2]].map(([name, lo, hi]) => {
    let slow = 60000 / speedAtVO2(vdot * lo),
      fast = 60000 / speedAtVO2(vdot * hi);
    return {
      name,
      slow,
      fast,
      lo,
      hi
    };
  });
}
function racePrediction(vdot, distKm) {
  let lo = 60,
    hi = 43200;
  for (let i = 0; i < 60; i++) {
    let mid = (lo + hi) / 2;
    if (danielsVDOT(distKm, mid) > vdot) lo = mid;else hi = mid;
  }
  return (lo + hi) / 2;
}
function durationText(sec) {
  if (!Number.isFinite(sec)) return '—';
  let s = Math.round(sec),
    h = Math.floor(s / 3600),
    m = Math.floor(s % 3600 / 60),
    r = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${m}:${String(r).padStart(2, '0')}`;
}
function runAnalysis() {
  let runs = S.logs.filter(x => x.type === 'run' && x.distance > 0 && x.pace > 0 && x.duration > 0);
  ['start', 'retest'].forEach(k => {
    let t = S.tests?.[k];
    if (t && +t[3] > 0) runs.push({
      name: '10-Minuten-Test',
      date: t.date || `Test ${k}`,
      distance: +t[3],
      duration: 10,
      pace: 600 / +t[3]
    });
  });
  runs = runs.map(x => ({
    ...x,
    vdot: danielsVDOT(x.distance, x.duration * 60)
  })).filter(x => Number.isFinite(x.vdot) && x.vdot > 0).sort((a, b) => b.vdot - a.vdot);
  let best = runs[0];
  if (!best) return {
    best: null,
    zones: [],
    predictions: [],
    zoneShares: []
  };
  let zones = vdotZones(best.vdot),
    distances = [5, 10, 21.0975, 42.195],
    predictions = distances.map(distance => {
      let riegel = best.duration * 60 * (distance / best.distance) ** 1.06,
        daniels = racePrediction(best.vdot, distance);
      return {
        distance,
        riegel,
        daniels
      };
    }),
    zoneShares = zones.map((z, zi) => {
      let matching = runs.filter(r => {
        let speed = 60000 / r.pace,
          vo2 = -4.6 + .182258 * speed + .000104 * speed * speed,
          pct = vo2 / best.vdot,
          first = zones.findIndex(q => pct >= q.lo && pct < q.hi);
        return first === zi;
      });
      let km = matching.reduce((n, x) => n + x.distance, 0),
        total = runs.reduce((n, x) => n + x.distance, 0);
      return {
        name: z.name,
        share: total ? km / total * 100 : 0
      };
    });
  return {
    best,
    zones,
    predictions,
    zoneShares
  };
}
function daysMissing() {
  let set = new Set(S.logs.map(x => x.date));
  let n = 0;
  for (let i = 0; i < 3; i++) if (!set.has(dateAgo(i))) n++;
  return n;
}
function muscleVolume() {
  let o = {};
  S.logs.filter(l => l.type === 'strength' && l.date >= dateAgo(6)).forEach(l => (l.exerciseResults || []).forEach(e => {
    let ex = Object.values(EX).flat().find(x => x[0] === e.origin), muscle=e.muscle||ex?.[1];
    if (muscle) o[muscle] = (o[muscle] || 0) + (e.doneCount || (e.summary ? e.summary.split(',').length : 0));
  }));
  (S.tri.sessions || []).filter(x => x.date >= dateAgo(6)).forEach(x => {
    o[x.muscle] = (o[x.muscle] || 0) + (x.setCount || 0);
  });
  return Object.entries(o).filter(([,count]) => count > 0).sort((a, b) => a[0].localeCompare(b[0]));
}
function setup() {
  return `<section class="section"><h2>Dein Trainingsort</h2><div class="card"><p class="small muted">Gleiche Übung, anderes Gerät: eigene Gewichte. Ergänze hier deine Trainingsorte.</p><label for="contextSetup">Aktueller Trainingsort</label><select id="contextSetup">${Object.entries(S.contexts).map(([id,name])=>`<option value="${esc(id)}" ${id===S.contextId?'selected':''}>${esc(name)}</option>`).join('')}</select><div class="formgrid" style="margin-top:12px"><div><label for="newContext">Neuer Trainingsort</label><input id="newContext" maxlength="60" placeholder="Name deines Studios"></div><button class="outline" data-add-context>Hinzufügen</button></div><p class="tiny muted">Gerätename und Gewichtsschritt stellst du direkt in der geöffneten Übung ein.</p></div></section><section class="section"><h2>Läufe & Einstellungen</h2><div class="card"><div class="formgrid">${[['easy','Easy Run'],['quality','Quality Run'],['long','Long Run']].map(([key,label])=>`<div><label for="target-${key}">${label}: Distanzziel (km)</label><input id="target-${key}" type="number" min="0.5" max="100" step="0.1" value="${S.runTargets[key]}"></div>`).join('')}<div><label for="paceInput">Persönlicher Tempo-Anker (mm:ss/km)</label><input id="paceInput" value="${esc(S.pace)}"></div><div><label for="bwInput">Körpergewicht (kg, optional)</label><input id="bwInput" type="number" min="0" max="400" value="${S.bodyweight||''}"></div><div><label for="pauseInput">Standardpause (Sek.)</label><input id="pauseInput" type="number" min="15" max="600" step="15" value="${S.pause}"></div></div><p class="small muted">Laufziele bleiben konstant, bis du sie selbst änderst. Der Tempo-Anker dient der bisherigen Laufanalyse und ist kein verpflichtendes Tempo.</p><details><summary>Analysefaktoren</summary><div class="formgrid">${[['Light','light','Leicht'],['Normal','normal','Normal'],['Hard','hard','Schwer']].map(([id,key,label])=>`<div><label for="factor${id}">Last je Minute · ${label}</label><input id="factor${id}" type="number" min="0.1" max="5" step="0.05" value="${S.loadFactors[key]}"></div>`).join('')}</div></details><button class="primary" data-save-setup style="margin-top:12px">Einstellungen speichern</button></div></section><section class="section"><h2>Dein 16-Wochen-Block</h2><div class="card"><div class="row"><button class="outline" data-week="-1" aria-label="Vorherige Woche">‹</button><div style="text-align:center"><b>Woche ${S.week} / 16</b><div class="small muted">${block()} · Zyklus ${S.cycle}</div></div><button class="outline" data-week="1" aria-label="Nächste Woche">›</button></div><p class="small muted">Wochen 4, 8 und 12: weniger Sätze und keine automatischen Steigerungen. Woche 16: Bilanz und optionaler Vergleich, danach neuer Zyklus. Die Kalenderwoche erhöht kein Gewicht.</p><button class="outline" data-weekfinish>${S.week===16?'Neuen Zyklus starten':'Woche abschließen'}</button></div></section><section class="section"><h2>So wächst dein Training</h2><div class="card"><b>Erst Wiederholungen, dann Gewicht</b><p class="small muted">Alle geplanten Sätze an der oberen Wiederholungsgrenze und mindestens 2 RIR im letzten Satz: beim nächsten Mal schlägt die App den verfügbaren Gewichtsschritt vor. Ohne RIR, bei fehlenden Sätzen oder einer neuen Variante bleibt die Steigerung aus. Bei unterstützten Übungen bedeutet weniger Unterstützung mehr Belastung.</p><p class="small muted">In den ersten Einheiten wählst du das Gewicht selbst. Die alten Setup-Gewichte bleiben als Referenz gespeichert.</p><details><summary>Frühere Referenzgewichte</summary>${Object.entries(S.weights).map(([key,value])=>`<div class="listrow small"><span>${esc(key)}</span><b>${value} kg</b></div>`).join('')}</details></div></section><section class="section"><h2>Routine & Messwerte</h2><div class="card"><p class="small muted">Optionale Erinnerungen an deine bestehende Routine:</p>${[['creatine','Kreatin in meiner Routine'],['caffeine','Koffein in meiner Routine']].map(([key,label])=>`<label><input type="checkbox" data-supp="${key}" ${S[key]?'checked':''} style="width:auto;min-height:auto"> ${label}</label>`).join('')}<div class="formgrid"><div><label for="waist">Taille (cm)</label><input id="waist" type="number" min="0" max="300" step="0.1"></div><div><label for="shoulder">Schulter (cm)</label><input id="shoulder" type="number" min="0" max="300" step="0.1"></div></div><button class="outline" data-measure>Messwerte speichern</button>${S.measurements.slice(-3).reverse().map(x=>`<p class="small muted">${esc(x.date)} · Taille ${x.waist||'—'} · Schulter ${x.shoulder||'—'} cm</p>`).join('')}</div></section><section class="section"><h2>Optionale Vergleichswerte</h2><div class="card"><p class="small muted">Deine bisherigen Testfelder bleiben erhalten. Ein 3RM-Test ist keine Pflicht und legt keine Arbeitsgewichte fest.</p><div class="formgrid">${['3RM Back Squat (kg)','3RM Overhead Press (kg)','3RM Deadlift (kg)','10 Min. Laufdistanz (km)'].map((name,i)=>`<div><label>${name}</label><input data-test="${i}" type="number" min="0" max="1500" step="0.1" value="${S.tests[S.week===16?'retest':'start']?.[i]||''}"></div>`).join('')}</div><button class="outline" data-test-save>Vergleichswerte speichern</button>${S.tests.start&&S.tests.retest?`<p class="small muted">Start → Retest: Squat ${S.tests.start[0]||'—'} → ${S.tests.retest[0]||'—'} kg · OHP ${S.tests.start[1]||'—'} → ${S.tests.retest[1]||'—'} kg · Deadlift ${S.tests.start[2]||'—'} → ${S.tests.retest[2]||'—'} kg</p>`:''}</div></section><section class="section"><h2>Backup & deine Daten</h2><div class="card"><p class="small muted">${S.logs.length} Einträge auf diesem Gerät. Die App synchronisiert nicht automatisch zwischen Browsern oder Geräten. Nutze dafür ein vollständiges Backup.</p><div class="actions"><button class="primary" data-export>Backup herunterladen</button><button class="outline" data-import>Backup einspielen</button><input id="backupfile" class="hidden" type="file" accept=".json,application/json"></div><details><summary style="margin-top:14px">Frühere Stände herunterladen</summary><div class="actions">${[['before-migration','Vor der Umstellung'],['before-import','Vor letztem Import'],['before-reset','Vor Zurücksetzen'],['parallel-window','Paralleles Fenster']].map(([key,label])=>`<button class="outline" data-backup-copy="${key}">${label}</button>`).join('')}</div></details><button class="warn" data-wipe style="margin-top:14px">Trainingsstand zurücksetzen</button></div></section><details class="section card"><summary>Training: Quellen & Einordnung</summary><p class="small muted">Der Plan ist eine praktische Anpassung an deinen Hybridaufbau. 61 Sätze und die Zeitziele sind Planungsentscheidungen, keine wissenschaftlich vorgeschriebenen Zahlen.</p><p><a href="https://acsm.org/resistance-training-guidelines-update-2026/" target="_blank" rel="noopener">ACSM 2026: Krafttraining individuell und regelmäßig gestalten</a></p><p><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC8891239/" target="_blank" rel="noopener">Schumann et al.: Kraft und Ausdauer kombinieren</a></p></details>`;
}
function openEditLog(id) {
  const l=S.logs.find(x=>x.id===id);if(!l)return;
  openSheet(`<h2 class="sheet-title">Eintrag bearbeiten</h2>${l.legacy?'<p class="small muted">Eintrag aus der alten Version. Zusammenfassungen bleiben erhalten, erzeugen aber keine neuen Gewichtsvorschläge.</p>':''}<div class="formgrid"><div><label for="editDate">Datum</label><input id="editDate" type="date" value="${esc(l.date)}"></div><div><label for="editName">Name</label><input id="editName" maxlength="100" value="${esc(l.name||l.type)}"></div><div><label for="editType">Art</label><select id="editType">${['run','strength','crossfit','metcon','accessory','bike','other','rest'].map(type=>`<option value="${type}" ${l.type===type?'selected':''}>${type}</option>`).join('')}</select></div><div><label for="editDuration">Dauer (Min.)</label><input id="editDuration" type="number" min="0" max="2880" step="0.1" value="${l.duration||0}"></div><div><label for="editDistance">Strecke (km)</label><input id="editDistance" type="number" min="0" max="250" step="0.1" value="${l.distance||0}"></div><div><label for="editEffort">Anstrengung</label><select id="editEffort">${[['light','Leicht'],['normal','Normal'],['hard','Schwer']].map(([value,label])=>`<option value="${value}" ${(l.effort||'normal')===value?'selected':''}>${label}</option>`).join('')}</select></div></div>${l.exerciseResults?.length?`<details><summary>Gespeicherte Sätze</summary>${l.exerciseResults.map(x=>`<p class="small"><b>${esc(x.exercise)}</b><br>${esc(x.summary||'Keine Sätze')} · ${x.rir==null?'RIR unbekannt':x.rir+' RIR'}</p>`).join('')}</details>`:''}<div class="actions"><button class="primary" data-save-log>Speichern</button><button class="warn" data-delete-current>Löschen</button><button class="outline" data-close>Schließen</button></div>`);
  const sheet=document.getElementById('sheet');
  sheet.querySelector('[data-save-log]').onclick=()=>{
    const next={...l,type:sheet.querySelector('#editType').value,date:sheet.querySelector('#editDate').value,name:sheet.querySelector('#editName').value.trim(),duration:Number(sheet.querySelector('#editDuration').value),distance:Number(sheet.querySelector('#editDistance').value),effort:sheet.querySelector('#editEffort').value};
    if(next.type==='rest'){next.duration=0;next.distance=0;next.load=0;next.pace=0;}else if(!(next.duration>0&&next.duration<=2880&&next.distance>=0&&next.distance<=250)||next.type==='run'&&next.distance<=0){toast('Bitte Dauer und Strecke prüfen.');return;}
    if(next.type==='run'){next.pace=next.duration*60/next.distance;next.load=next.duration*(paceToSec(S.pace)/next.pace)**2;}else if(next.type!=='rest'){next.pace=0;next.load=next.duration*(S.loadFactors[next.effort]??.7);}
    if(next.type!==l.type||next.date!==l.date){delete next.week;delete next.day;delete next.cycle;delete next.key;markPlanned(next);}
    const logs=DATA.upsertLog(S.logs,next),checked=DATA.validateBackup({...S,logs});if(!checked.ok){toast('Bitte Datum und Werte prüfen.');return;}
    S.logs=logs;save();sheet.remove();render();
  };
  sheet.querySelector('[data-delete-current]').onclick=()=>{
    if(!confirm('Diesen Eintrag löschen? Die Tagesanzeige wird danach aus den verbleibenden Einträgen berechnet.'))return;
    S.logs=S.logs.filter(x=>x.id!==id);if(S.session?.id===id)S.session.id=DATA.uid('strength');save();sheet.remove();render();
  };
}
function openSwap(origin) {
  const active=S.session?.items.find(x=>x.origin===origin);
  if(active?.sets.some(a=>a.done)){toast('Für diese Übung sind Sätze bestätigt. Wechsle die Variante vor dem nächsten Training.');return;}
  const choices=[origin,...TRAIN.alternatives(origin)];
  openSheet(`<h2 class="sheet-title">Übung wechseln</h2><p class="small muted">Wähle eine Variante für diesen Trainingsort. Gewicht und Vorleistung stammen nur aus derselben Variante am selben Gerät. Bestätigte Sätze werden nie umbenannt.</p><div class="list">${choices.map(name=>`<button class="listrow" data-choose-swap="${esc(name)}" data-origin="${esc(origin)}" style="width:100%;text-align:left"><span>${esc(name)}</span><span>›</span></button>`).join('')}</div><button class="outline" data-close>Schließen</button>`);
}
function openSheet(html) {
  document.getElementById('sheet')?.remove();
  const focus=document.activeElement, el=document.createElement('div');
  el.className='bottom';el.id='sheet';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Training bearbeiten');
  el.innerHTML=`<div class="sheet"><div class="grab"></div>${html}</div>`;document.body.appendChild(el);
  const close=()=>{el.remove();if(el.querySelector('[data-confirm-session]')&&S.session){S.session.paused=false;S.session.segmentStart=Date.now();save();render();}else focus?.focus?.();};
  el.addEventListener('click',e=>{
    if(e.target===el||e.target.closest('[data-close]'))close();
    const b=e.target.closest('[data-choose-swap]');if(!b)return;
    const origin=b.dataset.origin,name=b.dataset.chooseSwap, active=S.session?.items.find(x=>x.origin===origin);
    if(active?.sets.some(a=>a.done)){toast('Bestätigte Sätze verhindern diesen Wechsel.');return;}
    const context=S.session?.contextId||S.contextId;
    S.swaps[context+'|'+origin]=name;
    if(active){const slot={origin,name,muscle:active.muscle,sets:active.sets.length,min:active.min,max:active.max,rest:active.rest};const next=makeExercise(slot,context,S.session.week,name);Object.assign(active,next,{sets:Array.from({length:slot.sets},()=>({kg:next.rec.weight,reps:null,seconds:null,done:false})),rir:null});}
    save();close();render();
  });
  el.addEventListener('keydown',e=>{
    if(e.key==='Escape'){close();return;}
    if(e.key!=='Tab')return;
    const nodes=[...el.querySelectorAll('button,input,select,a[href],textarea')].filter(n=>!n.disabled&&!n.hidden);
    const first=nodes[0],last=nodes.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
  });
  el.querySelector('input,button,select')?.focus();
}
function proposeMove(day) {
  if (day === 6 || weekOrder()[day] === 6) {
    toast('Der Rehab-Tag bleibt am Sonntag.');
    return;
  }
  let cur = weekOrder();
  openSheet(`<h2 class="sheet-title">Einheit verschieben</h2><p class="small muted">Nur Einheiten heute oder später, die noch nicht erledigt sind. Tauscht mit einem anderen Tag dieser Woche.</p><div class="list">${cur.map((pi, to) => {
    let p = PLAN[pi],
      past = to < dow(),
      done = dayStatus(to).complete;
    let next = cur.slice();
    [next[day], next[to]] = [next[to], next[day]];
    let c = collision(next);
    return `<button class="listrow" data-move-to="${to}" data-from="${day}" ${past || done || to === day || to === 6 || cur[to] === 6 ? 'disabled' : ''} style="width:100%;text-align:left;background:transparent;border-radius:0;opacity:${past || done || to === day || to === 6 || cur[to] === 6 ? .45 : 1}"><span>${DAYS[to]} · ${esc(p.name)}${past ? ' · vergangen' : ''}${done ? ' · erledigt' : ''}</span><span class="small ${c.length ? 'ember' : 'muted'}">${c.length ? c[0].type : 'OK'}</span></button>`;
  }).join('')}</div><button class="outline" data-close style="width:100%;margin-top:10px">Schließen</button>`);
  document.querySelectorAll('[data-move-to]').forEach(b => b.onclick = () => {
    let to = +b.dataset.moveTo,
      from = +b.dataset.from;
    if (to === 6 || from === 6 || to < dow() || dayStatus(to).complete) return;
    let arr = weekOrder();
    [arr[from], arr[to]] = [arr[to], arr[from]];
    S.dayOrder[S.week] = arr;
    save();
    document.getElementById('sheet')?.remove();
    render();
  });
}
function readDuration(value) {
  const s=String(value??'').trim().replace(',','.');
  if(!s)return 0;
  if(/^\d+(\.\d+)?$/.test(s))return Number(s)*60;
  if(!/^\d{1,3}:\d{2}(:\d{2})?$/.test(s))return 0;
  const a=s.split(':').map(Number);if(a.slice(1).some(x=>x>=60))return 0;
  return a.length===3?a[0]*3600+a[1]*60+a[2]:a[0]*60+a[1];
}
function parseActivityDate(raw) {
  let s = String(raw || '').trim();
  if (!s) return '';
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return `${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`;
  m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (m) return `${m[3]}-${String(m[2]).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
  let d = new Date(s);
  return Number.isNaN(d.getTime()) ? '' : dateKey(d);
}
function csvParse(text) {
  let lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  let delimiter = (lines[0].match(/;/g) || []).length > (lines[0].match(/,/g) || []).length ? ';' : ',';
  let parseLine = s => {
    let out = [],
      v = '',
      q = false;
    for (let i = 0; i < s.length; i++) {
      let c = s[i];
      if (c === '"' && s[i + 1] === '"' && q) {
        v += '"';
        i++;
      } else if (c === '"') q = !q;else if (c === delimiter && !q) {
        out.push(v);
        v = '';
      } else v += c;
    }
    out.push(v);
    return out;
  };
  let h = parseLine(lines.shift()).map(x => x.toLowerCase().trim());
  let find = keys => h.findIndex(x => keys.some(k => x.includes(k)));
  let idate = find(['date', 'datum', 'start time', 'startzeit']),
    idist = find(['distance', 'distanz', 'strecke']),
    itime = find(['moving time', 'elapsed time', 'dauer', 'time', 'zeit']),
    iname = find(['activity type', 'sport', 'art', 'name']);
  return lines.map(line => {
    let a = parseLine(line),
      date = parseActivityDate(a[idate] || ''),
      dist = Number(String(a[idist] || '').replace(',', '.').replace(/[^0-9.]/g, ''));
    let dur = readDuration(a[itime]);
    if (!date || !dur) return null;
    let type = (a[iname] || 'run').toLowerCase().match(/run|lauf|walk|laufen/) ? 'run' : 'other';
    return {
      type,
      name: a[iname] || 'CSV-Import',
      date,
      duration: dur / 60,
      distance: dist || 0,
      pace: dist ? dur / dist : 0,
      load: type === 'run' && dist ? dur / 60 * (paceToSec(S.pace) / (dur / dist)) ** 2 : dur / 60 * .7
    };
  }).filter(Boolean);
}
function markPlanned(log) {
  if(Number.isInteger(log.week)&&Number.isInteger(log.day))return;
  const start=weekStart(new Date()),end=addDays(start,6);
  if(log.date<dateKey(start)||log.date>dateKey(end)||log.type==='rest')return;
  const di=(new Date(log.date+'T12:00:00').getDay()+6)%7,p=getPlan(di);
  if(log.type==='run'&&p.run||['strength','crossfit'].includes(log.type)&&isStrengthDay(p)){
    log.day=di;log.week=S.week;log.cycle=S.cycle;log.key=p.key;if(log.type==='run')log.runKind=p.run;
  }
}
function saveLog(log) {
  if(S.logs.some(x=>DATA.isDuplicate(x,log)))return false;
  log.id=log.id||DATA.uid(log.type);log.legacy=log.legacy??false;markPlanned(log);S.logs=DATA.upsertLog(S.logs,log);return true;
}
function bind() {
  const clicks=(selector,fn)=>document.querySelectorAll(selector).forEach(button=>button.onclick=event=>fn(button,event));
  clicks('[data-tab]',b=>{S.tab=b.dataset.tab;save();render();window.scrollTo(0,0);});
  clicks('[data-go]',b=>{S.tab=b.dataset.go;if(S.tab==='training')S.selectedDay=null;save();render();window.scrollTo(0,0);});
  clicks('[data-day]',b=>{S.selectedDay=Number(b.dataset.day);S.tab='training';save();render();window.scrollTo(0,0);});
  clicks('[data-done]',b=>{const key=dayKey(Number(b.dataset.done));S.completed[key]=!S.completed[key];save();render();toast(S.completed[key]?'Manuell markiert; ohne neue Leistungsdaten':'Manuelle Markierung entfernt');});
  clicks('[data-move-current]',()=>proposeMove(dow()));
  clicks('[data-move]',b=>proposeMove(Number(b.dataset.move)));
  clicks('[data-weekfinish]',()=>advanceWeek());
  clicks('[data-week]',b=>changeWeek(Number(b.dataset.week)));
  clicks('[data-routine]',b=>{const r=S.routine[today()]||[],i=Number(b.dataset.routine);S.routine[today()]=r.includes(i)?r.filter(x=>x!==i):r.concat(i);save();render();});
  clicks('[data-rehab]',b=>{S.rehab[today()]=S.rehab[today()]||{};const k=b.dataset.rehab;S.rehab[today()][k]=!S.rehab[today()][k];save();render();});
  clicks('[data-meal]',b=>{S.meals[today()]=S.meals[today()]||{};const i=b.dataset.meal;S.meals[today()][i]=!S.meals[today()][i];save();render();});
  clicks('[data-save-sleep]',()=>{const hours=Number(document.getElementById('sleepValue').value);if(!(hours>0&&hours<=16)){toast('Bitte Schlafstunden zwischen 0 und 16 eingeben.');return;}S.sleep=S.sleep.filter(x=>x.date!==today());S.sleep.push({date:today(),hours});S.readiness[today()]=S.readiness[today()]||{};S.readiness[today()].sleep=hours>=7?3:hours>=6?2:1;save();render();});
  clicks('[data-start]',b=>startSession(Number(b.dataset.start)));
  clicks('[data-save-run]',b=>{
    const day=Number(b.dataset.saveRun),distance=Number(document.getElementById('runDist').value),seconds=readDuration(document.getElementById('runTime').value);
    if(!(distance>0&&distance<=250&&seconds>0&&seconds<=48*3600)){toast('Bitte tatsächliche Strecke und eine gültige positive Laufzeit eingeben.');return;}
    const p=getPlan(day),pace=seconds/distance,duration=seconds/60;
    const added=saveLog({id:DATA.uid('run'),legacy:false,type:'run',name:p.name,runKind:p.run,key:p.key,week:S.week,cycle:S.cycle,day,date:today(),duration,distance,pace,load:duration*(paceToSec(S.pace)/pace)**2});
    save();render();toast(added?'Lauf gespeichert · Kraftteil wird separat gezählt':'Dieser Lauf ist bereits gespeichert');
  });
  clicks('[data-swap]',b=>openSwap(b.dataset.swap));
  document.querySelectorAll('[data-ready]').forEach(el=>el.onchange=()=>{S.readiness[today()]=S.readiness[today()]||{};if(el.value==='')delete S.readiness[today()][el.dataset.ready];else S.readiness[today()][el.dataset.ready]=Number(el.value);save();});
  const light=value=>{S.lighter=value;S.lighterDate=today();if(value){const di=Number.isInteger(S.selectedDay)?S.selectedDay:dow();if(!choiceLocked(getPlan(di),di))S.extras[dayKey(di)]='none';}save();render();};
  clicks('[data-easyday]',()=>light(!S.lighter));clicks('[data-advice-light]',()=>light(true));
  clicks('[data-tri]',()=>startTri(document.getElementById('triGroup')?.value||'shoulders'));
  clicks('[data-daymode]',b=>{
    const day=Number(b.dataset.modeday);if(choiceLocked(getPlan(day),day)){toast('Die begonnene Einheit legt die Trainingsart fest.');return;}
    S.dayMode[dayKey(day)]=b.dataset.daymode;if(b.dataset.daymode==='crossfit')S.extras[dayKey(day)]='none';save();render();
  });
  clicks('[data-wod-start]',b=>wodStart(b.dataset.wodStart,Number(b.dataset.wodDay),false));
  clicks('[data-wod-log]',b=>wodStart(b.dataset.wodLog,Number(b.dataset.wodDay),true));
  clicks('[data-wod-next]',b=>{const key=`${b.dataset.wodNext}-${dayKey(Number(b.dataset.wodDay))}`;S.wodPick[key]=(S.wodPick[key]||0)+1;save();render();});
  clicks('[data-save-setup]',saveSetup);
  document.querySelectorAll('[data-supp]').forEach(el=>el.onchange=()=>{S[el.dataset.supp]=el.checked;save();});
  clicks('[data-measure]',()=>{const waist=Number(document.getElementById('waist').value)||0,shoulder=Number(document.getElementById('shoulder').value)||0;if(waist<0||shoulder<0||waist>300||shoulder>300||!waist&&!shoulder){toast('Bitte mindestens einen gültigen Messwert eingeben.');return;}S.measurements.push({date:today(),waist,shoulder});save();render();});
  clicks('[data-test-save]',()=>{const tk=S.week===16?'retest':'start',values={date:today()};let valid=true;document.querySelectorAll('[data-test]').forEach(el=>{const value=Number(el.value)||0;if(value<0||value>1500)valid=false;values[el.dataset.test]=value;});if(!valid){toast('Bitte Testwerte prüfen.');return;}S.tests[tk]=values;save();render();toast('Vergleichswerte gespeichert');});
  clicks('[data-export]',exportBackup);
  clicks('[data-import]',()=>document.getElementById('backupfile').click());
  document.getElementById('backupfile')?.addEventListener('change',importBackup);
  clicks('[data-wipe]',()=>{
    if(!confirm('Trainingsstand auf diesem Gerät zurücksetzen? Der aktuelle Stand wird vorher gesichert; die Originaldaten der alten Version bleiben erhalten.'))return;
    try{const candidate=DATA.migrateState(fresh(),BASE);normalizeState(candidate);candidate.tab='setup';replaceState(candidate,'before-reset');toast('Neuer Trainingsstand angelegt');}catch(error){alert('Zurücksetzen abgebrochen: '+error.message);}
  });
  clicks('[data-edit-log]',b=>openEditLog(b.dataset.editLog));
  clicks('[data-add-manual]',()=>{
    const date=document.getElementById('manualDate').value||today(),type=document.getElementById('manualType').value,duration=Number(document.getElementById('manualDuration').value),distance=Number(document.getElementById('manualDistance').value)||0,effort=document.getElementById('manualEffort')?.value||'normal';
    if(!(duration>0&&duration<=2880&&distance>=0&&distance<=250)||type==='run'&&distance<=0){toast('Bitte Dauer und Strecke prüfen. Ein Lauf braucht eine positive Strecke.');return;}
    const pace=type==='run'?duration*60/distance:0,log={id:DATA.uid(type),legacy:false,type,name:'Nachgetragen',date,duration,distance,pace,effort,load:type==='run'?duration*(paceToSec(S.pace)/pace)**2:duration*(S.loadFactors[effort]??.7)};
    const check=DATA.validateBackup({...S,logs:[...S.logs,log]});if(!check.ok){toast('Bitte Datum und Eingaben prüfen.');return;}
    const added=saveLog(log);save();render();toast(added?'Einheit nachgetragen':'Doppelten Eintrag übersprungen');
  });
  clicks('[data-csv]',()=>document.getElementById('csvfile').click());
  document.getElementById('csvfile')?.addEventListener('change',async e=>{
    const file=e.target.files[0];if(!file)return;if(file.size>10*1024*1024){toast('Bitte eine CSV-Datei bis 10 MB wählen.');return;}
    try{const arr=csvParse(await file.text());if(arr.length>10000)throw Error('Zu viele Einträge');let logs=S.logs.slice(),n=0;arr.forEach(log=>{log.id=DATA.uid('csv');log.legacy=false;if(!logs.some(x=>DATA.isDuplicate(x,log))){logs.push(log);n++;}});const check=DATA.validateBackup({...S,logs});if(!check.ok)throw Error(check.error);S.logs=logs;save();render();toast(`${n} Einheiten importiert`);}catch(error){alert('CSV nicht importiert: '+error.message);}
  });
  clicks('[data-restday]',b=>{const date=b.dataset.restday;if(S.logs.some(l=>l.date===date))return;S.logs.push({id:DATA.uid('rest'),legacy:false,type:'rest',name:'Ruhetag markiert',date,duration:0,load:0});if(!S.restDays.includes(date))S.restDays.push(date);save();render();});
  clicks('[data-math]',b=>{
    const kind=b.dataset.math,text=kind==='load'?'Lauf: Dauer × (dein Tempo-Anker / tatsächliche Pace)². Andere Einheiten: Dauer × einstellbarer Anstrengungsfaktor.':kind==='anchor'?'95. Perzentil deiner erfassten Tageslasten in den letzten 42 Tagen, mindestens 40.':'EWMA ist ein geglätteter Durchschnitt deiner protokollierten Lasten. Die Zeitfenster betragen 42 bzw. 7 Tage; Tage ohne Eintrag bleiben als fehlend markiert.';
    openSheet(`<h2 class="sheet-title">So wird gerechnet</h2><p>${esc(text)}</p><p class="small muted">Die Werte beschreiben dein Protokoll. Sie messen weder deine tatsächliche Fitness noch dein Verletzungsrisiko.</p><button class="outline" data-close>Schließen</button>`);
  });
}
function exportBackup() {
  save();
  downloadJSON({format:'hybridwk-backup',version:4,exportedAt:new Date().toISOString(),state:S}, `hybridwk-backup-${today()}.json`);
}
async function importBackup(e) {
  const file = e.target.files[0];
  if (!file) return;
  e.target.value = '';
  if (file.size > 15 * 1024 * 1024) { alert('Bitte wähle ein Hybrid/Wk-Backup bis 15 MB.'); return; }
  try {
    const checked = DATA.validateBackup(JSON.parse(await file.text()));
    if (!checked.ok) throw new Error(checked.error);
    const candidate = DATA.migrateState(checked.state, BASE);
    normalizeState(candidate);
    const normalized = DATA.validateBackup(candidate);
    if (!normalized.ok) throw new Error(normalized.error);
    if (!confirm(`Backup mit ${candidate.logs.length} Einträgen und Woche ${candidate.week} einspielen? Der aktuelle Stand wird vorher lokal gesichert.`)) return;
    replaceState(candidate, 'before-import');
    toast('Backup wiederhergestellt');
  } catch (error) { alert('Backup nicht übernommen: ' + error.message); }
}
function onScroll() {
  let h = document.getElementById('top');
  if (h) h.classList.toggle('compact', window.scrollY > 14);
}
window.addEventListener('scroll', onScroll, {
  passive: true
});
window.addEventListener('beforeunload', () => { if (hydrated) { pauseActive(); save(); } });
document.addEventListener('visibilitychange', () => {
  if (hydrated && document.visibilityState === 'hidden') { pauseActive(); save(); }
  if (hydrated && document.visibilityState === 'visible') { render(); }
});
window.__hybridTest = {
  PLAN,
  W,
  EX,
  ALT,
  MUSCLE,
  collision,
  csvParse,
  round25,
  workWeight,
  percentile,
  finishSession,
  FINISHERS,
  CF,
  finisherFor,
  cfFor,
  wodClock,
  wodSave,
  parseClock,
  base: BASE
};
init();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});


function storageNotice(message) {
  const el = document.getElementById('storageStatus');
  if (el) { el.hidden = !message; el.textContent = message || ''; }
}
function normalizeState(state) {
  state.contextId = state.contextId || 'main';
  state.contexts = state.contexts || {main:'Mein Trainingsort'};
  if (!state.contexts[state.contextId]) state.contexts[state.contextId] = state.contextId;
  ['deviceSelections','exerciseSteps','extras'].forEach(k => { state[k] = state[k] || {}; });
  if (!state.runTargets || ['easy','quality','long'].some(k=>!(state.runTargets[k]>0))) {
    const current = W[Math.floor((state.week - 1) / 4)], n = (state.week - 1) % 4;
    const defaults = {easy:current.easy[n], long:current.long[n], quality:Number(current.quality[n].match(/\d+/)?.[0] || 5)};
    state.runTargets = state.runTargets || {};
    for (const kind of ['easy','quality','long']) {
      const last = state.logs.filter(l => l.type === 'run' && l.distance > 0 && (l.runKind === kind || String(l.name || '').toLowerCase().includes(kind === 'long' ? 'long' : kind === 'easy' ? 'easy' : 'quality'))).sort((a,b) => b.date.localeCompare(a.date))[0];
      if (!(state.runTargets[kind]>0)) state.runTargets[kind] = last ? last.distance : defaults[kind];
    }
  }
  if (state.lighterDate !== today()) { state.lighter = false; state.lighterDate = today(); }
  if (state.session) {
    const s = state.session;
    s.id = s.id || DATA.uid('strength'); s.week = s.week || state.week; s.cycle = s.cycle || state.cycle;
    s.date = s.date || (s.started ? dateKey(new Date(s.started)) : today());
    s.contextId = s.contextId || state.contextId;
    s.activeMs = Number(s.activeMs) || 0; s.segmentStart = null; s.paused = true;
    s.idx = Math.max(0, Math.min(s.idx || 0, s.items.length - 1));
    for (const item of s.items) {
      const meta = TRAIN.exercise(item.exercise);
      item.id = item.id || meta.id; item.deviceId = item.deviceId || 'standard';
      item.unit = item.unit || meta.unit; item.weightMode = item.weightMode || meta.weightMode;
      item.min = item.min || meta.defaultRange.min; item.max = item.max || meta.defaultRange.max;
      item.rest = item.rest || state.pause || 90; item.rir = item.rir ?? null;
      item.sets.forEach(set => { set.kg = set.kg ?? null; set.reps = set.reps ?? null; set.seconds = set.seconds ?? null; });
    }
  }
  if (state.tri?.active) {
    state.tri.active.logId = state.tri.active.logId || DATA.uid('tri');
    state.tri.active.activeMs = Number(state.tri.active.activeMs) || 0;
    state.tri.active.segmentStart = null; state.tri.active.paused = true;
  }
  if (state.wodRun) {
    state.wodRun.logId = state.wodRun.logId || DATA.uid('wod');
    state.wodRun.cycle = state.wodRun.cycle || state.cycle;
    if (state.wodRun.started && !state.wodRun.pausedAt && !state.wodRun.ended) state.wodRun.pausedAt = Date.now();
  }
}
async function init() {
  try { await load(); render(); }
  catch (error) {
    hydrated = false;
    document.getElementById('app').innerHTML = `<main class="content"><section class="section"><h1>Deine Daten bleiben erhalten.</h1><div class="card"><p>Der gespeicherte Stand konnte nicht vollständig gelesen werden. Er wurde nicht überschrieben.</p><p class="small muted">${esc(error.message)}</p><button class="primary" id="recoverRaw" ${startupOriginal===null?'disabled':''}>Originaldaten herunterladen</button><button class="outline" id="retryLoad">Erneut laden</button></div></section></main>`;
    document.getElementById('recoverRaw').onclick = () => downloadText(startupOriginal || '{}','hybridwk-originaldaten.json');
    document.getElementById('retryLoad').onclick = () => location.reload();
  }
}
function downloadText(text, filename) {
  const url = URL.createObjectURL(new Blob([text], {type:'application/json'}));
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function downloadJSON(value, filename) { downloadText(JSON.stringify(value, null, 2), filename); }
function replaceState(candidate, reason) {
  if (storageBlocked || localStorage.getItem(STORAGE_KEY) !== persistedJSON) throw new Error('Bitte zuerst den abweichenden Stand exportieren und dieses Fenster neu laden.');
  const previous = S, previousJSON = JSON.stringify(S);
  localStorage.setItem(STORAGE_KEY + ':' + reason, previousJSON);
  const candidateJSON = JSON.stringify(candidate);
  localStorage.setItem(STORAGE_KEY, candidateJSON);
  S = candidate; persistedJSON = candidateJSON;
  try { render(); }
  catch (error) {
    S = previous; localStorage.setItem(STORAGE_KEY,previousJSON); persistedJSON = previousJSON;
    render(); throw error;
  }
}
window.addEventListener('storage', event => {
  if (!hydrated || event.key !== STORAGE_KEY || event.newValue === persistedJSON) return;
  if (S.session || S.tri?.active || S.wodRun || document.getElementById('sheet') || document.activeElement?.matches('input,select,textarea')) {
    save(); return;
  }
  try {
    const checked = DATA.validateBackup(JSON.parse(event.newValue));
    if (!checked.ok) throw new Error(checked.error);
    const candidate = DATA.migrateState(checked.state,BASE); normalizeState(candidate);
    if (!DATA.validateBackup(candidate).ok) throw new Error('Ungültige Struktur');
    S = candidate; persistedJSON = event.newValue; storageBlocked = false; storageNotice(''); render();
  } catch (_) { storageNotice('Der Stand aus einem anderen Fenster konnte nicht übernommen werden. Bitte sichere deinen aktuellen Stand im Setup.'); }
});

function samePlanDay(log,di) { return log.week===S.week && log.day===di && (log.cycle||1)===S.cycle; }
function dayStatus(di) {
  const p=getPlan(di), logs=S.logs.filter(l=>samePlanDay(l,di)), strength=logs.some(l=>['strength','crossfit'].includes(l.type) && l.status!=='partial'), run=logs.some(l=>l.type==='run');
  const manual=!!S.completed[dayKey(di)], complete=manual || (isStrengthDay(p)?strength&&(!p.run||run):p.run?run:false);
  const label=manual?'Manuell markiert · keine Leistungsbestätigung':isStrengthDay(p)?`${strength?'✓':logs.some(l=>l.type==='strength'&&l.status==='partial')?'◐':'○'} Kraft / CrossFit${p.run?` · ${run?'✓':'○'} Lauf`:''}`:p.run?`${run?'✓':'○'} Lauf`:'Sonntag frei';
  return {strength,run,manual,complete,partial:!complete&&(strength||run||logs.some(l=>l.status==='partial')),label};
}
function extraChoice(di) { return isDeload()||S.week===16||S.lighter?'none':S.extras[dayKey(di)]||'none'; }
function buildDay(di) {
  const p=getPlan(di);let slots=(TRAIN.PROGRAM[p.key]||[]).map(x=>({...x}));
  if(extraChoice(di)==='tri'&&p.key==='upper')slots=slots.filter(x=>['Bankdrücken','Preacher Curl'].includes(x.origin));
  if(extraChoice(di)==='finisher')slots=slots.slice(0,-1);
  if(isDeload()||S.week===16||S.lighter)slots=slots.map(x=>({...x,sets:Math.max(1,x.sets-1)}));
  return slots.map(slot=>makeExercise(slot,S.contextId,S.week));
}
function makeExercise(slot,context,week,selected) {
  const name=selected||S.swaps[context+'|'+slot.origin]||S.swaps[slot.origin]||slot.name||slot.origin;
  const meta=TRAIN.exercise(name), original=TRAIN.exercise(slot.name||slot.origin);
  const unitChanged=meta.unit!==original.unit;
  const min=unitChanged?meta.defaultRange.min:slot.min,max=unitChanged?meta.defaultRange.max:slot.max;
  const deviceId=S.deviceSelections[context+'|'+meta.id]||'standard';
  const step=S.exerciseSteps[context+'|'+meta.id+'|'+deviceId]||meta.increment;
  const rec=TRAIN.recommend({logs:S.logs.filter(l=>l.id!==S.session?.id),exerciseId:meta.id,contextId:context,deviceId,sets:slot.sets,min,max,week,step});
  return {...meta,exercise:name,origin:slot.origin,muscle:slot.muscle,prescribedSets:slot.sets,min,max,rest:slot.rest,deviceId,step,rec};
}
function rangeText(x) { const meta=TRAIN.exercise(x.exercise);return `${x.min}–${x.max}${x.unit==='seconds'?' s':''}${meta.perSide?' je Seite':''}`; }
function weightText(weight,x) { return x.weightMode==='bodyweight'?'Körpergewicht':weight===null||weight===undefined?'Gewicht selbst wählen':`${weight} kg${x.weightMode==='assistance'?' Unterstützung':x.weightMode==='added'?' Zusatzgewicht':''}`; }
function setText(a,x) {return `${x.weightMode==='bodyweight'?'KG':(a.kg??a.weight??'—')+' kg'} × ${x.unit==='seconds'?(a.seconds||a.reps)+' s':a.reps}`;}
function validActualSet(a,x) {
  const value=x.unit==='seconds'?a.seconds:a.reps;
  if(!Number.isFinite(value)||value<=0||!Number.isInteger(value)||value>(x.unit==='seconds'?3600:250))return false;
  if(x.weightMode==='bodyweight')return true;
  return Number.isFinite(a.kg)&&a.kg<=1500&&(['added','assistance'].includes(x.weightMode)?a.kg>=0:a.kg>0);
}
function activeMilliseconds(s) {return (Number(s.activeMs)||0)+(s.segmentStart&&!s.paused?Math.max(0,Date.now()-s.segmentStart):0);}
function pauseActive() {
  for(const s of [S?.session,S?.tri?.active])if(s&&!s.paused){s.activeMs=activeMilliseconds(s);s.segmentStart=null;s.paused=true;}
}
function commitSession(duration,close) {
  const s=S.session;if(!s)return;
  const results=s.items.map(x=>({id:x.id,origin:x.origin,exercise:x.exercise,muscle:x.muscle,deviceId:x.deviceId,unit:x.unit,weightMode:x.weightMode,perSide:TRAIN.exercise(x.exercise).perSide,rir:x.rir??null,prescribedSets:x.sets.length,expected:x.sets.length,doneCount:x.sets.filter(a=>a.done).length,min:x.min,max:x.max,sets:x.sets.filter(a=>a.done).map(a=>({...a})),summary:x.sets.filter(a=>a.done).map(a=>setText(a,x)).join(', ')}));
  const complete=results.every(x=>x.doneCount===x.expected), vol=results.reduce((v,x)=>v+(x.unit==='seconds'||['bodyweight','assistance'].includes(x.weightMode)?0:x.sets.reduce((n,a)=>n+(Number(a.kg)||0)*(a.reps||0),0)),0);
  const rirs=results.filter(x=>x.rir!=null&&x.doneCount).map(x=>x.rir),rpe=rirs.length?rirs.reduce((n,x)=>n+10-x,0)/rirs.length:null,effort=rpe===null?'normal':rpe>=9?'hard':rpe<=6?'light':'normal';
  const prs=results.filter(x=>x.unit==='reps'&&x.weightMode==='external').flatMap(x=>x.sets.filter(a=>a.kg>0&&a.reps<=12).map(a=>({exercise:x.exercise,exerciseId:x.id,contextId:s.contextId,deviceId:x.deviceId,estimated1RM:Math.round(a.kg*(1+a.reps/30)*10)/10})));
  const log={id:s.id,type:'strength',legacy:!!s.legacy,name:s.name,key:s.key,week:s.week,cycle:s.cycle,day:s.day,date:s.date,contextId:s.contextId,duration,volume:vol,effort,load:duration*(S.loadFactors[effort]??.7),rpe,exerciseResults:results,prs,status:complete?'completed':'partial',closed:close,extra:s.extra||'none',readiness:s.readiness||null};
  S.logs=DATA.upsertLog(S.logs,log);s.activeMs=duration*60000;s.segmentStart=null;s.paused=true;
  if(close)S.session=null;
  S.selectedDay=s.day;S.tab='training';save();
}
function timerOwner() {return S?.tri?.active&&!S.tri.active.paused?S.tri.active:S?.session&&!S.session.paused?S.session:null;}
function restoreRestTimer() {
  clearInterval(timerId);const owner=timerOwner();if(!owner)return;
  const tick=()=>{
    const display=document.getElementById('timer'),left=owner.restEnd?Math.max(0,Math.ceil((owner.restEnd-Date.now())/1000)):0;
    if(display&&owner.restEnd)display.textContent=fmtSec(left);
    const elapsedDisplay=document.getElementById('sessionElapsed');if(elapsedDisplay)elapsedDisplay.textContent=fmtSec(activeMilliseconds(owner)/1000);
    if(owner.restEnd&&left===0){owner.restEnd=null;if(display)display.textContent='0:00';navigator.vibrate?.(80);save();}
  };tick();timerId=setInterval(tick,500);
}
function extrasPanel(p,di) {
  const choice=extraChoice(di),locked=choiceLocked(p,di),easy=isDeload()||S.week===16||S.lighter;
  return `<div class="card"><b>Dein Zusatzblock</b><p class="small muted">Ein Zusatz ersetzt einen Teil der Ergänzungsübungen. Wähle vor dem Start; das Zeitbudget bleibt bei 60 Minuten.</p><div class="actions" role="group" aria-label="Zusatzblock">${[['none','Kraft pur'],['finisher','6 Min. Finisher'],...(p.key==='upper'?[['tri','6-12-25']]:[])].map(([key,label])=>`<button class="${choice===key?'primary':'outline'}" data-extra="${key}" data-extra-day="${di}" aria-pressed="${choice===key}" ${locked||(easy&&key!=='none')?'disabled':''}>${label}</button>`).join('')}</div><p class="tiny muted">${easy?'In Entlastungs- und Bilanzwochen sowie an leichten Tagen bleiben Zusatzblöcke aus.':choice==='tri'?'6-12-25 ersetzt heute Klimmzüge, Rudern und die Core-Übung (6 Sätze). Bankdrücken und Bizeps bleiben.':choice==='finisher'?'Der Finisher ersetzt die letzte Ergänzungsübung. Start erst nach dem Kraftteil, wenn 6 Minuten im Zeitbudget bleiben.':'Alle geplanten Ergänzungsübungen bleiben enthalten.'}</p></div>`;
}
function deviceSheet() {
  const s=S.session,x=s?.items[s.idx];if(!x)return;
  if(x.sets.some(a=>a.done)){toast('Gerät und Gewichtsschritt bitte vor dem ersten bestätigten Satz ändern.');return;}
  openSheet(`<h2 class="sheet-title">Gerät & Gewichtsschritt</h2><p class="small muted">Ein anderes Gerät bekommt eine eigene Gewichtsserie. Beispiele: Kabelturm links, Beinpresse 2 oder Langhantel.</p><label for="deviceName">Gerätename</label><input id="deviceName" maxlength="60" value="${esc(x.deviceId==='standard'?'':x.deviceId)}" placeholder="Standardgerät"><label for="deviceStep">Verfügbarer Gewichtsschritt (kg)</label><input id="deviceStep" type="number" min="0.25" max="25" step="0.25" value="${x.step||2.5}"><button class="primary" data-save-device style="margin-top:12px">Übernehmen</button><button class="outline" data-close>Schließen</button>`);
  document.querySelector('[data-save-device]').onclick=()=>{
    const device=document.getElementById('deviceName').value.trim()||'standard',step=Number(document.getElementById('deviceStep').value);
    if(!(step>=.25&&step<=25)){toast('Bitte einen Gewichtsschritt von 0,25 bis 25 kg eintragen.');return;}
    S.deviceSelections[s.contextId+'|'+x.id]=device;S.exerciseSteps[s.contextId+'|'+x.id+'|'+device]=step;
    const next=makeExercise({origin:x.origin,name:x.exercise,muscle:x.muscle,sets:x.sets.length,min:x.min,max:x.max,rest:x.rest},s.contextId,s.week,x.exercise);
    Object.assign(x,next,{rir:null,sets:Array.from({length:x.sets.length},()=>({kg:next.rec.weight,reps:null,seconds:null,done:false}))});
    document.getElementById('sheet')?.remove();save();render();
  };
}

function bindRefresh() {
  const clicks=(selector,fn)=>document.querySelectorAll(selector).forEach(b=>b.onclick=()=>fn(b));
  clicks('[data-resume]',()=>{const active=S.session||S.tri?.active;if(active){active.paused=false;active.segmentStart=Date.now();S.tab='training';save();render();}});
  clicks('[data-dismiss-migration]',()=>{S.migrationNotice=false;save();render();});
  clicks('[data-extra]',b=>{const di=Number(b.dataset.extraDay);if(choiceLocked(getPlan(di),di))return;S.extras[dayKey(di)]=b.dataset.extra;save();render();});
  ['contextPick','contextSetup'].forEach(id=>document.getElementById(id)?.addEventListener('change',e=>{if(S.session||S.tri?.active||S.wodRun){toast('Den Trainingsort bitte nach der begonnenen Einheit wechseln.');e.target.value=S.contextId;return;}S.contextId=e.target.value;save();render();}));
  clicks('[data-add-context]',()=>{const input=document.getElementById('newContext'),name=input.value.trim();if(!name){toast('Bitte einen Namen für den Trainingsort eingeben.');return;}const existing=Object.entries(S.contexts).find(([,label])=>label.toLowerCase()===name.toLowerCase());if(existing)S.contextId=existing[0];else{const id=DATA.uid('gym');S.contexts[id]=name;S.contextId=id;}save();render();});
  clicks('[data-backup-copy]',b=>{try{let raw=localStorage.getItem(STORAGE_KEY+':'+b.dataset.backupCopy);if(!raw&&b.dataset.backupCopy==='before-migration')raw=localStorage.getItem('hybridwk-v3')||localStorage.getItem('hybridwk');if(!raw){toast('Für diesen Zeitpunkt liegt keine Sicherung vor.');return;}downloadText(raw,`hybridwk-${b.dataset.backupCopy}.json`);}catch(error){alert('Sicherung nicht verfügbar: '+error.message);}});
}
function saveSetup() {
  const value=id=>document.getElementById(id).value;
  const pace=value('paceInput').trim(),bodyweight=Number(value('bwInput'))||0,pause=Number(value('pauseInput'));
  const runTargets=Object.fromEntries(['easy','quality','long'].map(k=>[k,Number(value('target-'+k))]));
  const loadFactors={light:Number(value('factorLight')),normal:Number(value('factorNormal')),hard:Number(value('factorHard'))};
  if(!/^\d{1,2}:[0-5]\d$/.test(pace)||paceToSec(pace)<60||paceToSec(pace)>1800||bodyweight<0||bodyweight>400||!(pause>=15&&pause<=600)||Object.values(runTargets).some(n=>!(n>=.5&&n<=100))||Object.values(loadFactors).some(n=>!(n>=.1&&n<=5))){toast('Bitte Distanzen, Tempo, Pause und Faktoren prüfen.');return;}
  Object.assign(S,{pace,bodyweight,pause,runTargets,loadFactors});save();render();toast('Einstellungen gespeichert');
}
function changeWeek(delta) {
  if(S.session||S.tri?.active||S.wodRun){toast('Bitte die begonnene Einheit zuerst abschließen.');return;}
  S.week=Math.max(1,Math.min(16,S.week+delta));S.lighter=false;save();render();
}
function advanceWeek() {
  if(S.session||S.tri?.active||S.wodRun){toast('Bitte die begonnene Einheit zuerst abschließen.');return;}
  const pending=PLAN.slice(0,6).filter((_,di)=>!dayStatus(di).complete).length;
  if(!confirm(S.week===16?'Neuen 16-Wochen-Zyklus beginnen? Dein gesamter Verlauf bleibt erhalten.':`Woche ${S.week} abschließen${pending?` (${pending} Tage noch nicht vollständig erfasst)`:''}? Einträge und Markierungen bleiben erhalten.`))return;
  if(S.week===16){S.cycle++;S.week=1;S.completed={};S.dayOrder={};S.dayMode={};S.wodPick={};S.extras={};}else S.week++;
  S.selectedDay=null;S.lighter=false;save();render();
}

function bestLifts() {
  const result=new Map();
  S.logs.forEach(log=>(log.prs||[]).forEach(pr=>{
    const context=pr.contextId||log.contextId||'legacy',device=pr.deviceId||'standard',id=(pr.exerciseId||pr.exercise)+'|'+context+'|'+device;
    const name=pr.exercise+(log.legacy?' · Altbestand':' · '+(S.contexts[context]||context)+(device==='standard'?'':' / '+device));
    if(!result.has(id)||pr.estimated1RM>result.get(id).value)result.set(id,{name,value:pr.estimated1RM,date:log.date});
  }));
  return [...result.values()];
}
