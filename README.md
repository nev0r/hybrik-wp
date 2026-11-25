# Hybrid/Wk

Eine deutschsprachige Trainings-App für **16 Wochen Kraft und Laufen**, mit einem klaren Satzprotokoll, nachvollziehbaren Gewichtsvorschlägen und optionaler CrossFit-Abwechslung. Die App läuft ohne Konto im Browser und lässt sich als PWA auf dem Home-Bildschirm installieren.

**App öffnen:** [nev0r.github.io/hybrik-wp](https://nev0r.github.io/hybrik-wp/)

Version 4 behält die vertraute Wochenstruktur bei und überarbeitet Trainingsumfang, Progression und Datensicherheit. Das helle Design folgt derselben gestalterischen Richtung wie Snecki: weiche Farbverläufe, transparente Karten und eine feste mobile Navigation. Hybrid/Wk behält eigene blaue und korallfarbene Akzente. Die Oberfläche nutzt Systemschriften und braucht keine extern geladenen Fonts.

## Starten und weitertrainieren

1. **Bei vorhandenen Daten zuerst ein JSON-Backup exportieren.** Öffne anschließend dieselbe App-Adresse im bisherigen Browser. Ein anderer Browser oder eine Vorschau unter einer anderen Adresse hat einen eigenen Datenbestand.
2. **Im Setup den Trainingsort und die Laufziele prüfen.** Verschiedene Studios lassen sich getrennt führen. Die Kilometerziele für Easy Run, Quality Run und Long Run bestimmst du selbst.
3. **Im Training die tatsächliche Übungsvariante und das Gerät wählen.** Unter „Gerät & Gewichtsschritt“ lässt sich beispielsweise eine bestimmte Beinpresse oder ein Kabelturm benennen. Den verfügbaren Gewichtsschritt vor dem ersten bestätigten Satz einstellen.
4. **Beim ersten Training ein passendes Gewicht selbst wählen.** Für eine neue Kombination aus Übung, Trainingsort und Gerät gibt es noch keinen belastbaren Gewichtsvorschlag. Orientiere dich zunächst an etwa zwei weiteren sauberen Wiederholungen Reserve.
5. **Nur ausgeführte Sätze bestätigen.** Gewicht und Wiederholungen beziehungsweise Haltezeit eintragen, den Satz abhaken und die Reserve im letzten Arbeitssatz angeben. Die App unterscheidet Vorschläge, offene Sätze und tatsächlich dokumentierte Leistung.

Die fünf Bereiche heißen **Plan, Training, Verlauf, Analyse und Setup**. Die Woche wird bewusst weitergeschaltet; ein Kalenderwechsel erzeugt keine automatische Steigerung.

## Der Trainingsplan

Die normale Woche enthält **fünf Krafteinheiten mit zusammen 61 Arbeitssätzen und drei Läufe**. Aufwärmsätze sind nicht mitgezählt.

| Tag | Krafteinheit | Arbeitssätze | Lauf / Erholung |
| --- | --- | ---: | --- |
| Montag | Lower A: Kniebeuge, Beinpresse, Ausfallschritte, Beinbeuger, Waden | 11 | — |
| Dienstag | Push: Bankdrücken, Schulterdrücken, Schrägbank und Ergänzungen | 14 | Easy Run |
| Mittwoch | Pull: Klimmzüge, brustgestütztes Rudern, Latzug, hintere Schulter und Bizeps | 13 | Quality Run |
| Donnerstag | Lower B: Deadlift, Hip Thrust, Split Squat, Beinbeuger und Bauch | 11 | — |
| Freitag | Upper: Bankdrücken, Klimmzüge, brustgestütztes Rudern, Preacher Curl und Bauch | 12 | — |
| Samstag | — | — | Long Run |
| Sonntag | — | — | Freier Erholungstag mit optionaler Routine |

**Etwa 55–60 Minuten für den Kraftteil inklusive Aufwärmen sind das Planungsziel.** Laufzeiten kommen hinzu. Das ist keine garantierte Trainingsdauer: Aufwärmbedarf, einseitige Übungen, Gerätewechsel, Wartezeiten und individuelle Pausen können die Einheit verlängern. Die App zeigt die erfasste Dauer; beim Speichern lässt sie sich korrigieren. Wenn die Zeit knapp wird, kann ein Teilstand gespeichert werden.

Bankdrücken bleibt an zwei Tagen enthalten; direkte Bizepsarbeit liegt am Mittwoch und Freitag. Brustgestütztes Rudern und Hip Thrust sind bewusst gewählte Varianten im neuen Plan. Übungen können gegen hinterlegte Alternativen getauscht werden. Ein Wechsel eröffnet eine eigene Leistungsserie, damit beispielsweise Kurzhantel-, Langhantel- und Maschinenwerte nicht vermischt werden.

Hauptübungen haben meist zwei bis drei Minuten Satzpause, Ergänzungen überwiegend 60–90 Sekunden. In **Woche 4, 8 und 12** sinkt die Satzanzahl. **Woche 16** dient der Bilanz mit reduziertem Umfang; ein Maximaltest ist keine Voraussetzung. Ein aktivierter leichter Tag reduziert ebenfalls die Arbeitssätze und macht den Qualitätslauf locker.

### So entstehen Gewichtsvorschläge

Die Progression folgt den gespeicherten Leistungen. Feste Wochenfaktoren, geschätzte Maximalwerte und alte Standardgewichte bestimmen die neuen Trainingsziele nicht.

Für eine automatische Steigerung müssen diese Voraussetzungen zusammen erfüllt sein:

- Die letzte passende Leistung gehört zu **derselben Übungsvariante, demselben Trainingsort und demselben Gerät**.
- Alle erforderlichen Arbeitssätze sind mit gültigen Ist-Werten ausdrücklich bestätigt.
- Alle Sätze erreichen die obere Grenze des Wiederholungsbereichs.
- Die Arbeitssätze wurden mit derselben Last ausgeführt.
- Die dokumentierte Reserve beträgt mindestens **2 RIR**.
- Es ist keine Entlastungs- oder Bilanzwoche.

**RIR** bedeutet „Repetitions in Reserve“: wie viele weitere saubere Wiederholungen noch möglich gewesen wären. Zwei RIR heißen beispielsweise, dass nach dem letzten ausgeführten Satz schätzungsweise noch zwei saubere Wiederholungen möglich waren. Eine fehlende RIR-Angabe bleibt offen; eine früher vorausgefüllte RPE wird dafür nicht umgedeutet.

Wenn die Bedingungen passen, schlägt die App den nächsten für dieses Gerät hinterlegten Gewichtsschritt vor. Andernfalls bleibt das Niveau erhalten beziehungsweise die App erläutert, welche Information fehlt. Der Vorschlag ist keine automatisch bestätigte Leistung: Im nächsten Training zählen erneut die tatsächlich ausgeführten Sätze.

| Variante | Bedeutung des eingetragenen Gewichts |
| --- | --- |
| Langhantel | Gesamtgewicht inklusive der tatsächlichen Stange |
| Kurzhanteln | Kilogramm pro Hantel; Ausnahmen werden an der Übung erläutert |
| Maschine / Kabel | Angezeigte Last genau dieses Geräts |
| Körpergewichtsübung | Kein fiktives Kilogrammgewicht |
| Variante mit Zusatzgewicht | Nur die zusätzliche Last |
| Unterstützte Klimmzüge / Dips | Unterstützung in kg; weniger Unterstützung erhöht die Belastung |
| Halteübung | Zeit in Sekunden; daraus entsteht keine automatische kg-Steigerung |

Einseitige Übungen kennzeichnen Wiederholungen je Seite. Bei gemischten Satzgewichten wird keine pauschale Steigerung berechnet. Alte Zusammenfassungen, manuelle Tageshaken, WOD-Ergebnisse und bloß eingetragene Testwerte ersetzen keinen vollständigen vergleichbaren Satznachweis.

### Abwechslung innerhalb des Zeitbudgets

Vor Beginn des Kraftteils wählst du den Trainingsfokus und gegebenenfalls einen Zusatzblock. Diese Wahl wird für die begonnene beziehungsweise gespeicherte Einheit festgelegt.

| Auswahl | Was sich am Training ändert |
| --- | --- |
| **Kraft pur** | Alle vorgesehenen Kraftübungen bleiben enthalten. |
| **6 Minuten Finisher** | Die letzte Ergänzungsübung entfällt. Der Finisher beginnt nach dem Kraftteil und nur, wenn noch sechs Minuten im vorgesehenen Zeitbudget bleiben. |
| **6-12-25 am Upper-Tag** | Zwei Runden mit jeweils drei Sätzen ersetzen Klimmzüge, Rudern und die Core-Übung, zusammen sechs Sätze. Bankdrücken und Preacher Curl bleiben enthalten. |
| **CrossFit** | Ein WOD ersetzt den Kraftteil. Ein geplanter Lauf bleibt eine eigene Aufgabe. Finisher und 6-12-25 kommen an diesem Tag nicht zusätzlich dazu. |

Finisher und 6-12-25 schließen sich aus. In Entlastungs- und Bilanzwochen sowie an leichten Tagen sind diese Zusatzblöcke ausgesetzt. Die 6-12-25-Auswahl gehört zum Upper-Tag, der im Standardplan am Freitag liegt.

Die WOD-Bibliothek bietet AMRAP, EMOM und For Time mit Vorlauf, Pause/Fortsetzen, Rundenzähler beziehungsweise Stationsanzeige und Ergebniserfassung. Ein WOD kann auch ohne Timer eingetragen werden. Die Auswahl berücksichtigt benachbarte Bein- und Lauftage. Gewichte und Skalierung wählst du selbst; die App erkennt die Verfügbarkeit eines Geräts oder deinen aktuellen Erholungszustand nicht automatisch.

### Laufen und Wochenplanung

Die drei Laufziele sind persönliche Kilometerziele im Setup. **Sie steigen nicht automatisch mit der Planwoche.** Beim Umstieg können Ausgangswerte aus vorhandenen Läufen beziehungsweise dem bisherigen Plan übernommen werden; prüfe sie vor dem ersten Lauf.

Easy Run und Long Run bleiben locker. Für den Quality Run zeigt die App eine mögliche vertraute Belastungsform, aber kein automatisch berechnetes Intervalltempo. In Entlastungs- und Bilanzwochen sowie bei aktiviertem leichten Tag wird auch dieser Lauf locker gestaltet. Tatsächliche Distanz und Dauer werden beim Speichern eingetragen.

Ein Tag mit Kraft und Lauf ist erst vollständig protokolliert, wenn beide Bestandteile erfasst sind. Eine manuelle Tagesmarkierung wird als solche ausgewiesen und bestätigt keine Kraftleistung. Einheiten können verschoben werden; die Wochenansicht weist auf ungünstige Abfolgen wie schwere Beine neben einem Qualitätslauf hin. Diese Hinweise beruhen auf dem hinterlegten Plan und den vorhandenen Einträgen.

## Verlauf, Analyse und Routinen

Kraftsessions lassen sich pausieren, als Teilstand speichern und später fortsetzen. Wiederholtes Speichern derselben Session aktualisiert ihren Eintrag. Offene Sätze werden dabei nicht zu erledigten Sätzen. Die aktive Kraftzeit pausiert, wenn die App in den Hintergrund geht; die tatsächlich benötigte Dauer kann beim Abschluss korrigiert werden.

Im Verlauf bleiben Kraft-, Lauf-, WOD- und manuelle Einträge sichtbar. CSV-Import, Bearbeiten und Löschen ergänzen das direkte Tracking. Der Import erkennt gängige Spaltenbezeichnungen und prüft Dubletten; die importierten Angaben und Einheiten sollten kontrolliert werden. Ein CSV ist kein vollständiges App-Backup.

Die Analyse zeigt Wochenvergleiche, dokumentiertes Kraftvolumen, geschätzte Leistungswerte sowie Lauf- und Belastungsverläufe. e1RM, VDOT, Tempozonen, Prognosen und EWMA-Werte sind Modellrechnungen aus den vorhandenen Daten. Sie bestimmen keine Startgewichte und sind kein automatisches Urteil darüber, ob eine Belastung für dich passend ist. Fehlende Aufzeichnungstage sind keine bestätigten Ruhetage.

Schlaf, Tagesroutine, Mahlzeitenhaken, Körpermaße und Vergleichstests lassen sich ergänzend festhalten. Der sonntägliche Bereich „Rehab & Recovery“ ist eine freiwillige Erholungsroutine, kein individueller Rehabilitationsplan.

## Daten, Migration und Backup

### Lokal gespeichert

Trainingsdaten liegen im Browserspeicher des verwendeten Geräts. Es gibt kein Benutzerkonto, keinen eigenen Trainingsdatenserver und **keine automatische Synchronisierung zwischen Geräten oder Browsern**. Das Hosting liefert die App-Dateien; die App lädt den Trainingsverlauf nicht auf GitHub hoch.

Ein Browserwechsel, ein neues Gerät oder das Löschen von Website-Daten kann den Zugriff auf den bisherigen Stand beenden. **Vor solchen Änderungen und regelmäßig im Alltag ein JSON-Backup unter Setup → Backup & Daten exportieren.** Die heruntergeladene Datei getrennt vom Browser aufbewahren.

### Wechsel von der bisherigen Version

Version 4 verwendet den Speicherschlüssel `hybridwk-v4`. Wenn noch kein v4-Stand vorhanden ist, liest sie zuerst `hybridwk-v3`, danach gegebenenfalls den älteren Schlüssel `hybridwk`. Der alte Datensatz bleibt erhalten; vor der Migration wird zusätzlich eine lokale Sicherheitskopie angelegt.

Woche, Verlauf, Einstellungen und vorhandene Entwürfe werden übernommen, soweit ihre Struktur gültig ist. Alte Einträge erhalten eine Kennzeichnung. Ihre Zusammenfassungen bleiben sichtbar, steuern jedoch keine neuen Gewichtsvorschläge. Dafür benötigt v4 künftig bestätigte Sätze mit eindeutiger Übungs-, Orts- und Gerätezuordnung.

Kann ein gespeicherter Stand nicht gelesen werden, wird er nicht durch einen leeren Startzustand ersetzt. Die Fehleransicht bietet den Download der Originaldaten. Bei fehlendem Speicherplatz oder gesperrtem Browserspeicher erscheint ein sichtbarer Hinweis.

### JSON importieren

Der Export enthält den vollständigen App-Zustand im Format `hybridwk-backup`, Version 4. Ein Import prüft Format, Struktur und Werte, bevor etwas übernommen wird. Unterstützte ältere Rohdaten werden migriert. Die Dateigröße ist auf 15 MB begrenzt.

Nach einer Bestätigung ersetzt der importierte Stand den aktuellen Stand; es gibt keine automatische Zusammenführung zweier Backups. Vor dem Ersetzen wird der bisherige Zustand lokal gesichert. Ungültige Daten werden abgewiesen. Diese lokale Sicherheitskopie ist hilfreich bei einem Fehlimport, ersetzt aber keine separat gespeicherte Backup-Datei.

### Mehrere offene App-Fenster

Ein inaktives Fenster kann einen neuen Stand aus demselben Browserspeicher übernehmen. Bei einer laufenden Session, einem offenen Formular oder konkurrierenden Änderungen schützt die App den neueren gespeicherten Stand vor dem Überschreiben durch ein älteres Fenster.

Wenn ein Konflikthinweis erscheint: den abweichenden Stand dieses Fensters zunächst als Backup exportieren, andere App-Fenster schließen und die App anschließend neu öffnen. Die Stände werden nicht stillschweigend miteinander vermischt. Trainiere möglichst in einem App-Fenster gleichzeitig.

## Installation, Offline-Nutzung und Updates

Öffne die [bestehende App-Adresse](https://nev0r.github.io/hybrik-wp/) online. Auf dem iPhone lässt sie sich in Safari über das Teilen-Menü zum Home-Bildschirm hinzufügen. Der installierte Name lautet **Hybrid/Wk**.

Der Service Worker speichert die vollständige App-Shell. Erst wenn alle benötigten Dateien erfolgreich geladen wurden, kann diese Version offline verfügbar sein. Für den ersten Start und nach einer Veröffentlichung daher einmal eine vollständige Online-Verbindung zulassen. Schrift und Oberfläche sind lokal; externe Quellenlinks brauchen weiterhin Internetzugang.

Ein Update erzwingt keinen Reload während des Trainings. Nach einer neuen Veröffentlichung **alle bisherigen Hybrid/Wk-Tabs und App-Fenster schließen und die App erneut öffnen**. Gegebenenfalls zunächst einmal online öffnen, damit die neue Version geladen wird, danach erneut vollständig schließen und öffnen. Website-Daten müssen für ein Update nicht gelöscht werden.

Der Worker behandelt ausschließlich GET-Anfragen derselben Origin innerhalb seines App-Pfads. Alte Caches werden nur mit dem eigenen Präfix `hybridwk-` entfernt. HTML dient ausschließlich als Navigationsantwort; ein fehlendes Skript oder Stylesheet erhält keine HTML-Ersatzantwort.

Signaltöne, Bildschirm-Wachhalten und Vibration hängen von Browser, Gerät und Einstellungen ab. Die tatsächliche Bedienung und Installation sollten auf dem vorgesehenen Gerät geprüft werden.

## Projektstruktur und lokale Entwicklung

Die Anwendung ist statisches HTML, CSS und JavaScript ohne Build-Schritt oder Paketinstallation.

| Datei | Aufgabe |
| --- | --- |
| `index.html` | Einstieg, Metadaten und Laden der Module |
| `base.css` | Grundlayout und bestehende Komponenten |
| `redesign.css` | Helles Design, mobile Navigation und responsive Anpassungen |
| `data-core.js` | Datenformat v4, Validierung, Migration, IDs und Dublettenlogik |
| `training-core.js` | Übungskatalog, Kraftplan, Alternativen und Progressionsregeln |
| `app.js` | Oberfläche, Tracking, Timer, Auswertungen und lokale Speicherung |
| `sw.js` | Versionierter Offline-Cache und Lebenszyklus des Service Workers |
| `manifest.webmanifest` | PWA-Name, Startpfad, Anzeige und Farben |
| `icon-180.png`, `icon-512.png` | Bestehende App-Icons |
| `tests/*.test.js` | Automatisierte Prüfungen der Daten-, Trainings- und Offline-Logik |

Aus dem Repository-Verzeichnis einen lokalen Server starten:

```sh
python3 -m http.server 8080
```

Dann `http://localhost:8080/` öffnen. Eine über `file://` geöffnete HTML-Datei bildet den PWA-Betrieb nicht ab. Ein lokaler Test hat einen eigenen Browserspeicher und übernimmt nicht automatisch die Daten der veröffentlichten App.

### Prüfen

Die Tests verwenden den eingebauten Node.js-Test-Runner:

```sh
node --test tests/*.test.js
```

Syntax und Patch-Format lassen sich zusätzlich prüfen:

```sh
node --check data-core.js
node --check training-core.js
node --check app.js
node --check sw.js
git diff --check
```

Vor einer Veröffentlichung außerdem die Kernabläufe im Browser prüfen: erster Start, bestehende Daten, Übungstausch, Teilstand/Fortsetzen, Kraft plus Lauf, gegenseitiger Ausschluss der Zusatzblöcke, Backup-Import und Offline-Neustart. Für das Layout sind insbesondere schmale Mobilansichten mit 320 und 390 Pixeln sowie die auf 640 Pixel begrenzte Desktopansicht relevant.

### Veröffentlichen

Die App bleibt im Repository `nev0r/hybrik-wp` unter der vorhandenen GitHub-Pages-Adresse. Änderungen über die bestehende Pages-Konfiguration veröffentlichen.

Bei jeder Änderung an einer App-Shell-Datei **auch die Cache-Version in `sw.js` ändern**. HTML, beide CSS-Dateien, alle drei JavaScript-Module, Manifest, Icons und Service Worker gehören zusammen in die Veröffentlichung. Neue lokale Abhängigkeiten müssen in die `ASSETS`-Liste des Workers aufgenommen werden. `cache.addAll` installiert diese Liste atomar: Eine fehlende Datei verhindert die Aktivierung einer unvollständigen neuen Version.

## Fachliche Grundlage und bewusste Planentscheidungen

Die [ACSM-Zusammenfassung der aktualisierten Empfehlungen von 2026](https://acsm.org/resistance-training-guidelines-update-2026/) betont regelmäßiges, individuell passendes Krafttraining. Geräteart, Training bis zum Muskelversagen und komplexe Periodisierung zeigten für durchschnittliche gesunde Erwachsene keine durchgehend überlegenen Ergebnisse. Daraus folgt für diese App: Geräte und freie Gewichte können nebeneinander stehen; nachvollziehbare Leistung und ein durchhaltbarer Ablauf haben Vorrang vor ständig neuen Methoden.

Die [systematische Übersichtsarbeit und Meta-Analyse von Schumann et al. (2022)](https://pmc.ncbi.nlm.nih.gov/articles/PMC8891239/) fand in den zusammengefassten Studien im Mittel keine statistisch nachweisbare Beeinträchtigung von Muskelaufbau und Maximalkraft durch kombiniertes Ausdauer- und Krafttraining. Einschränkungen zeigten sich eher bei der Explosivkraft, besonders innerhalb derselben Trainingseinheit. Die Hinweise der App zu Abstand zwischen Kraft und Lauf sowie zur Reihenfolge belastender Tage sind eine praktische Umsetzung dieser Abwägung.

**Die konkrete Fünf-Tage-Aufteilung, 61 Arbeitssätze, das Zeitbudget von 55–60 Minuten, die Schwelle von 2 RIR und die Austauschregeln für Finisher und 6-12-25 sind Programm- und Produktentscheidungen.** Die genannten Quellen belegen kein universelles Optimum dieser Zahlen und prüfen diese App nicht. Trainingsumfang, Übungen und Erholung müssen zum tatsächlichen Leistungsstand und Alltag passen.
