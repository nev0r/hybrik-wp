/*
 * Hybrid Strength — training data and conservative, performance-led progression.
 * No calendar load multipliers, estimated 1RM, or legacy RPE defaults are used.
 * Weight convention: barbell total / dumbbell per hand / machine display.
 * perSide describes repetitions, not how many dumbbells are used.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HybridTraining = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const byName = Object.create(null);
  const byId = Object.create(null);
  const BAR = 'Gesamtgewicht inklusive Stange. Die tatsächliche Stange berücksichtigen.';
  const DB = 'Kilogramm pro Kurzhantel. Gerät und Hanteltyp getrennt dokumentieren.';
  const MACHINE = 'Angezeigte Last dieses Geräts; Übersetzung und Gewichtsblöcke sind gerätespezifisch.';
  const BW = 'Körpergewicht; kein fiktives Gewicht in Kilogramm eintragen.';
  const ADDED = 'Nur das zusätzliche Gewicht eintragen, ohne Körpergewicht.';
  const ASSIST = 'Unterstützung in Kilogramm: weniger Unterstützung bedeutet mehr Belastung.';

  function register(name, id, options) {
    const value = Object.assign({
      id, name, unit: 'reps', weightMode: 'external', perSide: false,
      increment: 2.5, defaultRange: { min: 8, max: 12 },
      cue: 'Kontrolliert bewegen und einen gut wiederholbaren Bewegungsumfang nutzen.',
      weightNote: MACHINE, known: true
    }, options || {});
    value.defaultRange = Object.freeze(Object.assign({}, value.defaultRange));
    Object.freeze(value);
    byName[name] = value;
    byId[id] = value;
    return value;
  }
  function alias(name, original) { byName[name] = byName[original]; }
  function db(name, id, options) {
    return register(name, id, Object.assign({ increment: 1, weightNote: DB }, options || {}));
  }
  function bodyweight(name, id, options) {
    return register(name, id, Object.assign({ weightMode: 'bodyweight', increment: 0, weightNote: BW }, options || {}));
  }

  register('Back Squat', 'barbell-back-squat', { defaultRange: { min: 6, max: 8 }, weightNote: BAR, cue: 'Rumpf anspannen, den ganzen Fuß belasten und die Tiefe kontrollieren.' });
  register('Front Squat', 'barbell-front-squat', { weightNote: BAR, cue: 'Ellbogen hoch halten und mit aufrechtem Oberkörper absenken.' });
  register('Hack Squat', 'hack-squat', { cue: 'Füße stabil aufsetzen und die Tiefe kontrolliert wählen.' });
  register('Goblet Squat', 'goblet-squat', { increment: 2, weightNote: 'Gesamtgewicht der einzelnen Hantel vor der Brust.', cue: 'Hantel nah am Oberkörper halten und zwischen den Hüften absenken.' });
  register('Smith Machine Squat', 'smith-machine-squat', { weightNote: 'Dokumentierte Gesamtlast derselben Smith Machine; Stangengewicht beziehungsweise Gegengewicht berücksichtigen.' });
  register('Beinpresse', 'leg-press', { defaultRange: { min: 10, max: 12 }, cue: 'Becken auf dem Polster lassen und die Knie in Richtung der Zehen bewegen.' });
  db('Walking Lunges', 'walking-lunge', { perSide: true, defaultRange: { min: 10, max: 12 }, cue: 'Wiederholungen je Bein zählen; jeden Schritt kontrolliert abfangen.' });
  db('Reverse Lunge', 'reverse-lunge', { perSide: true, cue: 'Kontrolliert zurücksteigen und über das vordere Bein aufrichten.' });
  db('Step-up', 'dumbbell-step-up', { perSide: true, cue: 'Über das Bein auf der Box aufrichten; mit dem unteren Bein wenig abdrücken.' });
  db('Split Squat', 'dumbbell-split-squat', { perSide: true, cue: 'Stand stabil halten und die Wiederholungen je Bein dokumentieren.' });
  register('Seated Leg Curl', 'seated-leg-curl', { defaultRange: { min: 10, max: 15 }, cue: 'Hüfte auf dem Sitz halten und die Knie kontrolliert beugen.' });
  alias('Seated Hamstring Curl', 'Seated Leg Curl');
  register('Lying Leg Curl', 'lying-leg-curl', { defaultRange: { min: 10, max: 15 }, cue: 'Hüfte auf der Auflage lassen und ohne Schwung beugen.' });
  register('Standing Single-Leg Curl', 'standing-single-leg-curl', { perSide: true, defaultRange: { min: 10, max: 15 } });
  bodyweight('Slider Leg Curl', 'slider-leg-curl', { defaultRange: { min: 8, max: 12 }, cue: 'Fersen kontrolliert vor- und zurückschieben; Bewegungsumfang passend wählen.' });
  register('Standing Calf Raise', 'standing-calf-raise', { defaultRange: { min: 12, max: 15 }, cue: 'Unten kontrolliert dehnen und oben kurz halten, ohne zu federn.' });
  register('Seated Calf Raise', 'seated-calf-raise', { defaultRange: { min: 12, max: 20 } });
  register('Calf Press', 'calf-press', { defaultRange: { min: 12, max: 20 }, cue: 'Fußballen sicher aufsetzen und nur aus dem Sprunggelenk bewegen.' });
  bodyweight('Single-Leg Calf Raise', 'single-leg-calf-raise', { perSide: true, defaultRange: { min: 12, max: 20 } });

  register('Bankdrücken', 'barbell-bench-press', { defaultRange: { min: 6, max: 10 }, weightNote: BAR, cue: 'Schulterblätter stabil halten; kontrolliert absenken und gleichmäßig drücken.' });
  alias('Bench Press', 'Bankdrücken');
  db('DB Bench Press', 'dumbbell-bench-press', { cue: 'Beide Hanteln kontrollieren und einen komfortablen Bewegungsumfang nutzen.' });
  register('Machine Chest Press', 'machine-chest-press');
  register('Smith Machine Bench Press', 'smith-machine-bench-press', { weightNote: 'Dokumentierte Gesamtlast derselben Smith Machine; Stangengewicht beziehungsweise Gegengewicht berücksichtigen.' });
  bodyweight('Push-up', 'push-up', { defaultRange: { min: 8, max: 15 }, cue: 'Körper als stabile Linie bewegen; Höhe beziehungsweise Variante konstant halten.' });
  register('Overhead Press', 'barbell-overhead-press', { defaultRange: { min: 6, max: 10 }, weightNote: BAR, cue: 'Rumpf stabil halten und die Stange ohne starkes Zurücklehnen nach oben führen.' });
  db('Seated DB Shoulder Press', 'seated-dumbbell-shoulder-press');
  register('Machine Shoulder Press', 'machine-shoulder-press');
  register('Landmine Press', 'landmine-press', { perSide: true, weightNote: 'Aufgelegte Scheiben an der Landmine; dieselbe Stange und Station dokumentieren.', cue: 'Einarmig nach vorne oben drücken und den Rumpf stabil halten.' });
  db('Incline DB Press', 'incline-dumbbell-press');
  register('Incline Bench Press', 'incline-barbell-bench-press', { weightNote: BAR });
  register('Incline Machine Press', 'incline-machine-press');
  bodyweight('Feet-Elevated Push-up', 'feet-elevated-push-up', { defaultRange: { min: 8, max: 15 }, cue: 'Fußhöhe konstant halten und den Körper als stabile Linie bewegen.' });
  register('Cable Lateral Raise', 'cable-lateral-raise', { perSide: true, increment: 1, defaultRange: { min: 12, max: 20 }, cue: 'Arm seitlich kontrolliert anheben; Oberkörper ruhig halten.' });
  db('DB Lateral Raise', 'dumbbell-lateral-raise', { defaultRange: { min: 12, max: 20 } });
  register('Machine Lateral Raise', 'machine-lateral-raise', { defaultRange: { min: 12, max: 20 } });
  register('Lean-Away Cable Lateral Raise', 'lean-away-cable-lateral-raise', { perSide: true, increment: 1, defaultRange: { min: 12, max: 20 } });
  register('Rope Triceps Pushdown', 'rope-triceps-pushdown', { defaultRange: { min: 10, max: 15 }, cue: 'Oberarme ruhig halten und die Ellbogen kontrolliert strecken.' });
  register('Cable Triceps Pushdown', 'cable-triceps-pushdown', { defaultRange: { min: 10, max: 15 } });
  register('Overhead Triceps Extension', 'cable-overhead-triceps-extension', { defaultRange: { min: 10, max: 15 }, cue: 'Rumpf stabil halten und die Ellbogen kontrolliert beugen und strecken.' });
  alias('Cable Overhead Triceps Extension', 'Overhead Triceps Extension');
  register('DB Overhead Triceps Extension', 'dumbbell-overhead-triceps-extension', { increment: 2, defaultRange: { min: 10, max: 15 }, weightNote: 'Gewicht der einzelnen Hantel, die mit beiden Händen gehalten wird.' });
  register('EZ Bar Skull Crusher', 'ez-bar-skull-crusher', { defaultRange: { min: 10, max: 15 }, weightNote: BAR });
  bodyweight('Close-Grip Push-up', 'close-grip-push-up', { defaultRange: { min: 8, max: 15 } });

  bodyweight('Klimmzüge strikt', 'strict-pull-up', { defaultRange: { min: 6, max: 10 }, cue: 'Ohne Schwung ziehen; Griff und Bewegungsumfang für Vergleiche konstant halten.' });
  alias('Klimmzüge', 'Klimmzüge strikt');
  register('Assisted Pull-up', 'assisted-pull-up', { weightMode: 'assistance', defaultRange: { min: 6, max: 10 }, weightNote: ASSIST, cue: 'Gleichmäßig ziehen und dieselbe Unterstützungsmaschine dokumentieren.' });
  register('Weighted Pull-up', 'weighted-pull-up', { weightMode: 'added', defaultRange: { min: 6, max: 10 }, weightNote: ADDED, cue: 'Nur Zusatzgewicht dokumentieren; ohne Schwung ziehen.' });
  register('Chest-Supported Row', 'chest-supported-machine-row', { cue: 'Brust an der Auflage halten und die Ellbogen kontrolliert zurückführen.', weightNote: 'Last der brustgestützten Maschine. Für Kurzhanteln die eigene Variante DB Chest-Supported Row wählen.' });
  db('DB Chest-Supported Row', 'chest-supported-dumbbell-row');
  register('Seated Cable Row', 'seated-cable-row', { cue: 'Rumpf ruhig halten und aus den Armen und Schulterblättern ziehen.' });
  register('Machine Row', 'machine-row');
  db('One-Arm DB Row', 'one-arm-dumbbell-row', { perSide: true });
  register('Pendlay Row', 'pendlay-row', { defaultRange: { min: 6, max: 8 }, weightNote: BAR });
  register('Lat Pulldown', 'lat-pulldown', { defaultRange: { min: 10, max: 12 }, cue: 'Griff kontrolliert vor die Brust ziehen, ohne den Oberkörper stark zu schwingen.' });
  register('Neutral-Grip Lat Pulldown', 'neutral-grip-lat-pulldown', { defaultRange: { min: 8, max: 12 } });
  register('Rear Delt Fly', 'rear-delt-machine-fly', { defaultRange: { min: 12, max: 20 }, cue: 'Arme kontrolliert öffnen und die Schultern unten lassen.', weightNote: 'Last am Gerät. Kurzhantel- und Kabelvarianten separat wählen.' });
  register('Reverse Pec Deck', 'reverse-pec-deck', { defaultRange: { min: 12, max: 20 } });
  register('Cable Rear Delt Fly', 'cable-rear-delt-fly', { defaultRange: { min: 12, max: 20 } });
  db('DB Rear Delt Fly', 'dumbbell-rear-delt-fly', { defaultRange: { min: 12, max: 20 } });
  register('Face Pulls', 'face-pull', { defaultRange: { min: 12, max: 20 }, cue: 'Zum Gesicht ziehen, ohne ins Hohlkreuz auszuweichen.' });
  register('EZ Bar Curl', 'ez-bar-curl', { weightNote: BAR, cue: 'Oberarme ruhig halten; ohne Hüftschwung beugen und kontrolliert absenken.' });
  register('Cable Curl', 'cable-curl', { defaultRange: { min: 10, max: 15 } });
  db('DB Curl', 'dumbbell-curl');
  register('Preacher Curl', 'ez-bar-preacher-curl', { defaultRange: { min: 10, max: 15 }, weightNote: BAR, cue: 'Oberarme auf dem Polster lassen und unten kontrolliert abbremsen.' });
  register('Machine Preacher Curl', 'machine-preacher-curl', { defaultRange: { min: 10, max: 15 } });
  db('Incline DB Curl', 'incline-dumbbell-curl', { defaultRange: { min: 10, max: 15 } });
  db('Hammer Curl', 'dumbbell-hammer-curl', { defaultRange: { min: 10, max: 15 }, cue: 'Neutralen Griff halten und ohne Oberkörperschwung beugen.' });
  register('Rope Hammer Curl', 'rope-hammer-curl', { defaultRange: { min: 10, max: 15 } });
  db('Cross-Body Hammer Curl', 'cross-body-hammer-curl', { perSide: true, defaultRange: { min: 10, max: 15 } });
  db('Incline Hammer Curl', 'incline-hammer-curl', { defaultRange: { min: 10, max: 15 } });

  register('Deadlift', 'conventional-deadlift', { defaultRange: { min: 4, max: 6 }, weightNote: BAR, cue: 'Rumpf vor jeder Wiederholung anspannen und die Stange nah am Körper führen.' });
  register('Trap Bar Deadlift', 'trap-bar-deadlift', { defaultRange: { min: 4, max: 6 }, weightNote: 'Gesamtgewicht inklusive Trap Bar; Griffhöhe und Stange getrennt dokumentieren.' });
  register('Romanian Deadlift', 'barbell-romanian-deadlift', { weightNote: BAR, cue: 'Hüfte zurückschieben und die Stange nah an den Beinen halten.' });
  register('Rack Pull', 'rack-pull', { defaultRange: { min: 4, max: 6 }, weightNote: 'Gesamtgewicht inklusive Stange; Ablagehöhe im Gerätekontext festhalten.' });
  register('Hip Thrust', 'barbell-hip-thrust', { weightNote: BAR, cue: 'Oben die Hüfte strecken, ohne ins Hohlkreuz auszuweichen.' });
  register('Machine Hip Thrust', 'machine-hip-thrust');
  bodyweight('Glute Bridge', 'bodyweight-glute-bridge', { defaultRange: { min: 12, max: 20 }, cue: 'Füße stabil aufsetzen und das Becken kontrolliert anheben.' });
  register('Cable Pull-Through', 'cable-pull-through', { defaultRange: { min: 10, max: 15 } });
  db('Bulgarian Split Squat', 'dumbbell-bulgarian-split-squat', { perSide: true, cue: 'Vorderes Bein kontrolliert belasten; Wiederholungen je Seite zählen.' });
  register('Cable Crunch', 'cable-crunch', { defaultRange: { min: 12, max: 15 }, cue: 'Den Brustkorb zum Becken einrollen und mit dem Bauch arbeiten.' });
  register('Machine Crunch', 'machine-crunch', { defaultRange: { min: 12, max: 15 } });
  bodyweight('Dead Bug', 'dead-bug', { perSide: true, defaultRange: { min: 8, max: 12 }, cue: 'Gegengleichen Arm und Bein langsam strecken; Rumpfposition kontrollieren.' });
  bodyweight('Plank', 'forearm-plank', { unit: 'seconds', defaultRange: { min: 20, max: 45 }, cue: 'Gleichmäßig atmen und die Position nur so lange sauber halten.' });
  register('Weighted Plank', 'weighted-forearm-plank', { weightMode: 'added', unit: 'seconds', defaultRange: { min: 20, max: 45 }, weightNote: ADDED, cue: 'Zusatzgewicht und Haltezeit getrennt dokumentieren; Position sauber halten.' });
  bodyweight('Hanging Knee Raise', 'hanging-knee-raise', { defaultRange: { min: 10, max: 15 }, cue: 'Knie ohne Schwung anheben und das Becken kontrolliert einrollen.' });
  bodyweight('Captain Chair Knee Raise', 'captain-chair-knee-raise', { defaultRange: { min: 10, max: 15 } });
  bodyweight('Reverse Crunch', 'reverse-crunch', { defaultRange: { min: 10, max: 15 } });
  bodyweight('Dips', 'bodyweight-dip', { defaultRange: { min: 8, max: 10 } });
  register('Weighted Dips', 'weighted-dip', { weightMode: 'added', weightNote: ADDED });
  register('Assisted Dips', 'assisted-dip', { weightMode: 'assistance', weightNote: ASSIST });

  // A normal week has 61 working sets. Optional conditioning replaces time in
  // the session; it is not included in these sets. The app handles deload volume.
  function item(name, muscle, sets, min, max, rest) {
    return Object.freeze({ origin: name, name, muscle, sets, min, max, rest });
  }
  const PROGRAM = Object.freeze({
    squat: Object.freeze([
      item('Back Squat', 'Quadrizeps · Gesäß', 3, 6, 8, 180),
      item('Beinpresse', 'Quadrizeps · Gesäß', 2, 10, 12, 90),
      item('Walking Lunges', 'Beine · Gesäß', 2, 10, 12, 90),
      item('Seated Leg Curl', 'Beinbeuger', 2, 10, 15, 75),
      item('Standing Calf Raise', 'Waden', 2, 12, 15, 60)
    ]),
    push: Object.freeze([
      item('Bankdrücken', 'Brust · Trizeps', 3, 6, 8, 180),
      item('Overhead Press', 'Schultern · Trizeps', 3, 6, 10, 150),
      item('Incline DB Press', 'Brust', 2, 8, 12, 90),
      item('Cable Lateral Raise', 'Seitliche Schulter', 2, 12, 20, 60),
      item('Rope Triceps Pushdown', 'Trizeps', 2, 10, 15, 60),
      item('Overhead Triceps Extension', 'Trizeps', 2, 10, 15, 60)
    ]),
    pull: Object.freeze([
      item('Klimmzüge strikt', 'Rücken · Bizeps', 3, 6, 10, 150),
      item('Chest-Supported Row', 'Rücken', 2, 8, 12, 90),
      item('Lat Pulldown', 'Latissimus', 2, 10, 12, 90),
      item('Rear Delt Fly', 'Hintere Schulter', 2, 12, 20, 60),
      item('EZ Bar Curl', 'Bizeps', 2, 8, 12, 75),
      item('Hammer Curl', 'Bizeps · Brachialis', 2, 10, 15, 60)
    ]),
    deadlift: Object.freeze([
      item('Deadlift', 'Hintere Kette', 3, 4, 6, 180),
      item('Hip Thrust', 'Gesäß', 2, 8, 12, 90),
      item('Bulgarian Split Squat', 'Beine · Gesäß', 2, 8, 12, 90),
      item('Seated Hamstring Curl', 'Beinbeuger', 2, 10, 15, 75),
      item('Cable Crunch', 'Bauch', 2, 12, 15, 60)
    ]),
    upper: Object.freeze([
      item('Bankdrücken', 'Brust · Trizeps', 3, 8, 10, 150),
      item('Klimmzüge strikt', 'Rücken · Bizeps', 2, 6, 10, 120),
      item('Chest-Supported Row', 'Rücken', 2, 8, 12, 90),
      item('Preacher Curl', 'Bizeps', 3, 10, 15, 75),
      item('Hanging Knee Raise', 'Bauch', 2, 10, 15, 60)
    ])
  });

  const ALTERNATIVES = {
    'Back Squat': ['Front Squat', 'Hack Squat', 'Goblet Squat'],
    'Beinpresse': ['Hack Squat', 'Goblet Squat', 'Smith Machine Squat'],
    'Walking Lunges': ['Reverse Lunge', 'Step-up', 'Split Squat'],
    'Seated Leg Curl': ['Lying Leg Curl', 'Standing Single-Leg Curl', 'Slider Leg Curl'],
    'Standing Calf Raise': ['Seated Calf Raise', 'Calf Press', 'Single-Leg Calf Raise'],
    'Bankdrücken': ['DB Bench Press', 'Machine Chest Press', 'Push-up', 'Smith Machine Bench Press'],
    'Overhead Press': ['Seated DB Shoulder Press', 'Machine Shoulder Press', 'Landmine Press'],
    'Incline DB Press': ['Incline Bench Press', 'Incline Machine Press', 'Feet-Elevated Push-up'],
    'Cable Lateral Raise': ['DB Lateral Raise', 'Machine Lateral Raise', 'Lean-Away Cable Lateral Raise'],
    'Rope Triceps Pushdown': ['Cable Triceps Pushdown', 'DB Overhead Triceps Extension', 'Close-Grip Push-up'],
    'Overhead Triceps Extension': ['EZ Bar Skull Crusher', 'DB Overhead Triceps Extension', 'Rope Triceps Pushdown'],
    'Klimmzüge strikt': ['Lat Pulldown', 'Assisted Pull-up', 'Weighted Pull-up'],
    'Chest-Supported Row': ['Seated Cable Row', 'DB Chest-Supported Row', 'Machine Row', 'One-Arm DB Row'],
    'Lat Pulldown': ['Assisted Pull-up', 'Neutral-Grip Lat Pulldown', 'Klimmzüge strikt'],
    'Rear Delt Fly': ['Reverse Pec Deck', 'Cable Rear Delt Fly', 'DB Rear Delt Fly', 'Face Pulls'],
    'EZ Bar Curl': ['Cable Curl', 'DB Curl', 'Preacher Curl'],
    'Hammer Curl': ['Rope Hammer Curl', 'Cross-Body Hammer Curl', 'Incline Hammer Curl'],
    'Deadlift': ['Trap Bar Deadlift', 'Romanian Deadlift', 'Rack Pull'],
    'Hip Thrust': ['Machine Hip Thrust', 'Glute Bridge', 'Cable Pull-Through'],
    'Bulgarian Split Squat': ['Reverse Lunge', 'Step-up', 'Split Squat'],
    'Cable Crunch': ['Machine Crunch', 'Dead Bug', 'Plank'],
    'Preacher Curl': ['Cable Curl', 'Incline DB Curl', 'Machine Preacher Curl'],
    'Hanging Knee Raise': ['Captain Chair Knee Raise', 'Reverse Crunch', 'Dead Bug'],
    'Pendlay Row': ['Chest-Supported Row', 'Seated Cable Row', 'One-Arm DB Row'],
    'Romanian Deadlift': ['Hip Thrust', 'Cable Pull-Through', 'Machine Hip Thrust'],
    'Seated DB Shoulder Press': ['Overhead Press', 'Machine Shoulder Press', 'Landmine Press'],
    'Dips': ['Assisted Dips', 'Weighted Dips', 'Machine Chest Press'],
    'Face Pulls': ['Cable Rear Delt Fly', 'Reverse Pec Deck', 'DB Rear Delt Fly']
  };

  function slug(value) {
    return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  function exercise(name) {
    const found = byName[name] || byId[name];
    if (found) return Object.assign({}, found, {
      name: byName[name] ? name : found.name,
      defaultRange: Object.assign({}, found.defaultRange)
    });
    return {
      id: 'custom-' + (slug(name) || 'exercise'), name: String(name || 'Eigene Übung'),
      unit: 'reps', weightMode: 'external', perSide: false, increment: 2.5,
      defaultRange: { min: 8, max: 12 }, known: false,
      cue: 'Variante und Gerät vor dem Training eindeutig festlegen.',
      weightNote: 'Für diese eigene Übung ist keine automatische Gewichtsempfehlung hinterlegt.'
    };
  }
  function alternatives(origin) {
    const found = byName[origin] || byId[origin];
    return (ALTERNATIVES[origin] || (found && ALTERNATIVES[found.name]) || []).slice();
  }
  function label(value, fallback) {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
  }
  function number(value) {
    if (typeof value !== 'number' && typeof value !== 'string') return NaN;
    if (typeof value === 'string' && !value.trim()) return NaN;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }
  function firstPresent() {
    for (let i = 0; i < arguments.length; i++) {
      if (arguments[i] !== undefined && arguments[i] !== null) return arguments[i];
    }
    return undefined;
  }
  function actualSet(set, meta) {
    if (!set || (set.done !== true && set.confirmed !== true)) return null;
    if (set.unit && set.unit !== meta.unit) return { invalid: true };
    const value = number(meta.unit === 'seconds'
      ? firstPresent(set.seconds, set.reps, set.value)
      : firstPresent(set.reps, set.value));
    const kg = meta.weightMode === 'bodyweight' ? null : number(firstPresent(set.kg, set.weight));
    const valid = value > 0 && (meta.unit === 'seconds' || Number.isInteger(value))
      && (kg === null || (Number.isFinite(kg) && kg >= 0));
    if (!valid) return { invalid: true };
    const normalized = Object.assign({}, set, {
      done: true, confirmed: true, kg, reps: value, unit: meta.unit
    });
    if (meta.unit === 'seconds') normalized.seconds = value;
    return normalized;
  }
  function dateScore(entry) {
    const value = firstPresent(entry.finishedAt, entry.date, entry.createdAt, entry.timestamp);
    const stamp = typeof value === 'number' ? value : Date.parse(value);
    return Number.isFinite(stamp) ? stamp : 0;
  }

  /**
   * Only saved strength performances with actual, explicitly confirmed sets
   * qualify. Exact exercise / studio / device identity is mandatory. The old
   * origin+summary logs remain displayable by the app but cannot drive targets.
   */
  function getLastPerformance(logs, query) {
    query = query || {};
    const meta = byId[query.exerciseId];
    if (!meta || !Array.isArray(logs)) return null;
    const contextId = label(query.contextId, 'main');
    const deviceId = label(query.deviceId, 'standard');
    let latest = null;
    logs.forEach(function (entry, entryIndex) {
      if (!entry || entry.type !== 'strength' || entry.legacy === true
        || label(entry.contextId, 'main') !== contextId || !Array.isArray(entry.exerciseResults)) return;
      entry.exerciseResults.forEach(function (result, resultIndex) {
        if (!result || result.legacy === true || result.id !== query.exerciseId
          || label(result.deviceId, 'standard') !== deviceId
          || result.unit !== meta.unit || result.weightMode !== meta.weightMode
          || !Array.isArray(result.sets)) return;
        const confirmed = result.sets.map(function (set) { return actualSet(set, meta); }).filter(Boolean);
        if (!confirmed.length) return;
        const valid = confirmed.filter(function (set) { return !set.invalid; });
        const score = dateScore(entry);
        if (!latest || score > latest.score || (score === latest.score && (entryIndex > latest.entryIndex
          || (entryIndex === latest.entryIndex && resultIndex > latest.resultIndex)))) {
          latest = {
            entry, exercise: result, sets: valid,
            date: firstPresent(entry.finishedAt, entry.date, entry.createdAt, entry.timestamp, null),
            invalidSets: confirmed.length - valid.length, score, entryIndex, resultIndex
          };
        }
      });
    });
    if (!latest) return null;
    return { entry: latest.entry, exercise: latest.exercise, sets: latest.sets, date: latest.date, invalidSets: latest.invalidSets };
  }
  function documentedRir(result, sets) {
    const recorded = number(result.rir);
    const values = sets.map(function (set) { return number(set.rir); });
    const validValues = values.filter(function (value) { return Number.isFinite(value) && value >= 0 && value <= 10; });
    if (Number.isFinite(recorded) && recorded >= 0 && recorded <= 10) {
      // A harder explicitly recorded set cannot be overridden by an easier
      // whole-exercise rating. Empty set-level fields do not erase that rating.
      return Math.min.apply(Math, [recorded].concat(validValues));
    }
    // A per-set RIR is accepted only when every actual set has one. RPE is
    // deliberately never translated, because legacy RPE was pre-populated.
    if (!sets.length) return null;
    return values.every(function (value) { return Number.isFinite(value) && value >= 0 && value <= 10; })
      ? Math.min.apply(Math, values) : null;
  }
  function result(kind, weight, message) { return { kind, weight, message }; }
  function roundWeight(value) { return Math.round(value * 1000000) / 1000000; }
  function format(value) { return String(roundWeight(value)).replace('.', ','); }

  function recommend(options) {
    options = options || {};
    const meta = byId[options.exerciseId];
    if (!meta) return result('new', null, 'Übung zuerst eindeutig festlegen; es wird kein Gewicht aus einer anderen Übung übernommen.');
    const last = getLastPerformance(options.logs, options);
    if (!last) {
      const requestedMin = number(options.min), requestedMax = number(options.max);
      const range = Number.isFinite(requestedMin) && requestedMin > 0 && Number.isFinite(requestedMax) && requestedMax >= requestedMin
        ? { min: requestedMin, max: requestedMax } : meta.defaultRange;
      if (meta.unit === 'seconds') {
        return result('new', null, 'Noch keine vergleichbare Haltezeit für diese Variante. Wähle eine sauber haltbare Zeit im Zielbereich ' + format(range.min) + '–' + format(range.max) + ' Sekunden.');
      }
      if (meta.weightMode === 'bodyweight') {
        return result('new', null, 'Noch keine vergleichbare Einheit für diese Körpergewichtsvariante. Beginne im Zielbereich ' + format(range.min) + '–' + format(range.max) + ' Wiederholungen mit kontrollierter Technik.');
      }
      return result('new', null, 'Noch keine vergleichbare Einheit für diese Übung an diesem Gerät. Ein passendes Startniveau mit etwa 2 Wiederholungen Reserve wählen.');
    }
    const actual = last.sets;
    const timeOrBodyweight = meta.unit === 'seconds' || meta.weightMode === 'bodyweight';
    const weight = timeOrBodyweight || !actual.length ? null : actual[actual.length - 1].kg;
    const week = number(options.week);
    if ([4, 8, 12, 16].indexOf(week) !== -1) {
      return result('deload', weight, 'Entlastungs- beziehungsweise Testwoche: keine automatische Steigerung. Weniger Arbeitssätze und ausreichende Reserve einplanen.');
    }
    if (last.invalidSets || !actual.length) {
      return result('hold', weight, 'Die letzte Einheit enthält unvollständige Ist-Werte. Erst bestätigte Sätze mit gültigen Werten dokumentieren.');
    }
    const required = number(options.sets);
    const prescribed = number(last.exercise.prescribedSets);
    const min = number(firstPresent(options.min, meta.defaultRange.min));
    const max = number(firstPresent(options.max, meta.defaultRange.max));
    if (!Number.isInteger(required) || required < 1 || !Number.isInteger(prescribed) || prescribed < 1
      || !Number.isFinite(min) || min <= 0 || !Number.isFinite(max) || max < min) {
      return result('hold', weight, 'Für eine Steigerung müssen Satzanzahl und Wiederholungs- beziehungsweise Zeitbereich eindeutig dokumentiert sein.');
    }
    if (actual.length < required || actual.length < prescribed) {
      return result('hold', weight, 'Noch nicht alle geplanten Arbeitssätze bestätigt. Das Niveau zunächst wiederholen und vollständig dokumentieren.');
    }
    if (meta.unit === 'seconds') {
      return result('hold', null, 'Haltezeit in Sekunden dokumentieren und innerhalb des Zielbereichs sauber ausführen. Daraus wird keine automatische Kilogramm-Steigerung berechnet.');
    }
    const rir = documentedRir(last.exercise, actual);
    if (rir === null) {
      return result('hold', weight, 'Die tatsächlich übrigen Wiederholungen (RIR) fehlen. Das Niveau halten; eine voreingestellte RPE zählt nicht als Leistungsnachweis.');
    }
    if (meta.weightMode === 'bodyweight') {
      const message = actual.every(function (set) { return set.reps >= max; }) && rir >= 2
        ? 'Oberes Wiederholungsziel mit Reserve erreicht. Eine schwierigere Variante bewusst wählen und als eigene Übung dokumentieren; kein Körpergewicht als Zusatzlast übernehmen.'
        : 'Zuerst im Wiederholungsbereich mit sauberer Technik steigern. Bei dieser Variante wird kein Kilogramm-Ziel berechnet.';
      return result('hold', null, message);
    }
    if (!actual.every(function (set) { return Math.abs(set.kg - weight) < 0.000001; })) {
      return result('hold', weight, 'Unterschiedliche Lasten in den Arbeitssätzen: keine pauschale Steigerung. Die tatsächlich verwendeten Lasten einzeln wieder aufnehmen.');
    }
    if (!actual.every(function (set) { return set.reps >= max; }) || rir < 2) {
      return result('hold', weight, 'Last halten, bis alle geplanten Sätze das obere Wiederholungsziel mit mindestens 2 Wiederholungen Reserve erreichen.');
    }
    const providedStep = number(options.step);
    const step = Number.isFinite(providedStep) && providedStep > 0 ? providedStep : meta.increment;
    if (!(step > 0)) return result('hold', weight, 'Den kleinsten verfügbaren Gewichtsschritt dieses Geräts festlegen.');
    if (meta.weightMode === 'assistance') {
      const next = roundWeight(Math.max(0, weight - step));
      if (next === weight) return result('hold', weight, 'Bereits ohne Unterstützung ausgeführt. Eine Körpergewichtsvariante bewusst wählen und separat dokumentieren.');
      return result('increase', next, 'Alle Sätze geschafft: Unterstützung auf ' + format(next) + ' kg reduzieren. Weniger Unterstützung erhöht die Belastung.');
    }
    const next = roundWeight(weight + step);
    return result('increase', next, 'Alle Sätze am oberen Ziel mit dokumentierter Reserve: nächstes Mal ' + format(next) + ' kg' + (meta.weightMode === 'added' ? ' Zusatzgewicht' : '') + ' für genau diese Variante und dieses Gerät versuchen.');
  }

  return Object.freeze({ PROGRAM, exercise, alternatives, getLastPerformance, recommend });
}));
