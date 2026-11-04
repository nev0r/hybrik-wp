# Hybrid/Wk — iPhone-Trainings-App

Eine deutschsprachige, lokal speichernde PWA für den 16-Wochen-Kraft-/Laufplan. Enthält einen optionalen CrossFit-WOD-Abschluss. Das Farbsystem ist Midnight Black (#02070A), Electric Blue (#0297DE) und Cantaloupe Orange (#FC734D). Die Startansicht folgt einem editorialen Landingpage-Stil mit zentrierter Serif-Headline und blau-orangem Lichtakzent; Trainingsnavigation und Funktionen bleiben erhalten. Die App braucht kein Konto und keinen eigenen Server; auf GitHub Pages wird sie statisch ausgeliefert.

## Dateien

- `index.html` – App und Benutzeroberfläche
- `manifest.webmanifest` – PWA-Name, Anzeige und Icons
- `sw.js` – Network-first-Service-Worker mit Offline-Fallback
- `icon-180.png`, `icon-512.png` – App-Icons
- `README.md` – diese Anleitung

## Online stellen und auf dem iPhone installieren

1. Melde dich bei GitHub an und erstelle ein Repository, zum Beispiel `hybrid-wk`. Für ein öffentliches Repository ist GitHub Pages im kostenlosen Tarif typischerweise am einfachsten.
2. Öffne das Repository, wähle **Add file → Upload files** und lade alle fünf App-Dateien (HTML, Manifest, Service Worker und beide Icons) in den Repository-Hauptordner. `README.md` kannst du ebenfalls hochladen.
3. Öffne **Settings → Pages**. Unter **Build and deployment** als Quelle **Deploy from a branch** wählen, Branch `main`, Ordner `/(root)`, dann **Save**.
4. Warte, bis GitHub Pages die Website veröffentlicht hat. Die URL sieht üblicherweise so aus: `https://DEIN-GITHUB-NAME.github.io/hybrid-wk/`.
5. Öffne diese HTTPS-Adresse in **Safari auf dem iPhone**. Tippe auf **Teilen → Zum Home-Bildschirm** und bestätige den Namen.
6. Öffne die App einmal online, damit der Service Worker die Dateien zwischenspeichern kann. Danach kann der App-Shell-Bereich offline aufgehen. Die Anton-Schrift wird extern von Google Fonts geladen und ist offline nicht garantiert; es gibt einen Systemschrift-Fallback.

GitHub kann Menünamen oder Pages-Einstellungen ändern. Die App selbst ist eine statische Website; GitHub Pages und Safari werden nicht von dieser Datei verwaltet.

## Was enthalten ist

- Fünf Bereiche: Programm, Training, Verlauf, Analyse und Setup.
- Vorgegebene Arbeitsgewichte, 16 Wochenfaktoren, Deloads und Laufkilometer aus dem Prompt.
- Wochentage, Trainingssessions mit Satzgewicht/Wiederholungen/Abhaken, RPE-Auswahl, Pausentimer, Volumen und Epley-e1RM-Näherung.
- Laufprotokoll mit Pace- und Belastungsrechnung; 95%-Anker, EWMA-Fitness/Ermüdung, Wochenvergleich, Daniels-VDOT/Tempozonen und Modellprognosen nach Riegel/Daniels.
- Manuelle Trainingseinträge und CSV-Import mit Spaltenerkennung, Datums-/Dezimalformaten, Duplikatprüfung sowie Bearbeiten/Löschen.
- Wochencheck für direkte Bein-/Lauf-Kollisionen, Verschieben mit Vorab-Prüfung und Vorschlag für einen kollisionsärmeren Tausch, Tagesform-Anpassung und Ruhetag-Markierung.
- Tagesroutine, Schlafschnitt, Mahlzeitenhaken, Körpermaße, Performance-Tests mit Start-/Retest und bestätigungspflichtige Gewichtsvorschläge.
- Sonntag als „Rehab & Recovery“: trainingsfrei, freiwilliger Spaziergang/Mobilität, Meal- und Schlafplanung sowie optionaler Sauna-Hinweis mit Sicherheitsgrenzen. Haken werden lokal gespeichert; der Tag ist kein Verletzungs-Rehaplan.
- Optionales 6-12-25-Tri-Set mit zwei Runden und Satztracking; WOD-Generator mit Beispiel-Metcons und manueller Zeit-/Rundeneingabe. Zusätze zählen nicht als geplante Trainingseinheit.
- Übungstausch (vier hinterlegte Alternativen pro Planübung), Aufwärmleiter und Scheibenrechner.
- Lokale Speicherung per `localStorage`, mit optionalem `window.storage`-Fallback. Backup-Export und -Import werden empfohlen.

## Bekannte Einschränkungen

Die zentralen Tracking-Abläufe sind umgesetzt, aber diese lokale PWA ist weiterhin eine persönliche Trainingshilfe und kein zertifiziertes Medizin- oder Coachingsystem.

- Analysewerte sind Modellrechnungen. Daniels-VDOT, Tempozonen und Prognosen nach Riegel/Daniels hängen von der Genauigkeit deiner besten protokollierten Leistung ab. EWMA nutzt protokollierte Tage innerhalb der 42-/7-Tage-Fenster; Tage ohne Aufzeichnung werden gezählt und nicht als Ruhe ausgegeben. Die Belastungskennzahl 7:28 ist umstritten und sollte nicht isoliert bewertet werden.
- CSV-Import erkennt gängige Garmin-/Strava-Spaltennamen, Datumsformate, Dezimalkomma und hh:mm:ss. Nicht jedes Exportformat oder jede Einheit (z. B. Meilen statt Kilometer) lässt sich automatisch erkennen; Import bitte kontrollieren.
- Gewichtsvorschläge folgen einfachen Regeln aus deinen protokollierten Sätzen und RPE-Werten. Sie werden nie ohne Bestätigung übernommen und in Deload-/Testwochen unterdrückt. Tagesform-Hinweise beruhen auf deinen Einträgen und ersetzen keine eigene Einschätzung.
- CrossFit-WODs sind optionale Beispiel-Metcons mit manueller Ergebnisaufnahme. Eine automatische Skalierung nach Equipment, Leistungsstand oder Verletzungen gibt es nicht. Das 6-12-25-Tri-Set hat einen einfachen Satz-Runner und ist in Deload-/Testwochen gesperrt.
- Sauna wird am Sonntag nur als freiwillige Option gezeigt, nicht als belegte Pflichtmaßnahme: mögliche Recovery-Effekte sind nicht eindeutig, Hitze kann Flüssigkeitsverlust und Blutdruckabfall begünstigen. Bei Vorerkrankungen oder Beschwerden ist individuelle medizinische Rücksprache wichtig; Quellenlinks stehen in der App.
- Die Routine- und Mahlzeitenhaken erfassen nur, was du abhaken möchtest; sie bewerten weder Ernährung noch Gesundheit. Körpermaße und Testwerte sind manuelle Einträge.
- Es gibt keine Push-Benachrichtigungen. Offline-Betrieb setzt voraus, dass die App einmal online geöffnet wurde, damit der Service Worker die App-Dateien zwischenspeichert.
- Die JavaScript-Logik wurde hier statisch und mit einer einfachen simulierten DOM-Umgebung geprüft. Eine echte Safari-/iPhone-Installation, Touch-Bedienung, Home-Bildschirm-Installation und Offline-Nutzung auf einem Gerät konnte ich nicht testen.

## Datenschutz und Hinweis

Trainingseinträge bleiben im Browser des jeweiligen Geräts. Beim Löschen von Browserdaten oder Wechsel des Geräts können sie verloren gehen; nutze dafür den Backup-Export. Die App stellt keine medizinischen Diagnosen dar. Bei Brustschmerz, Schwindel oder einem Puls, der nicht runtergeht, bitte medizinisch abklären lassen. Supplements und Belastungssteuerung sind keine individuelle medizinische Beratung.
