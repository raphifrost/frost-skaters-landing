# ❄️ Frost Skaters – Website Version 1.1

Offizielle GitHub-Pages-Website der unabhängigen Eislauf-Community **Frost Skaters**.

- **Aktuelle Version 1.1 (15. Oktober 2026):** Startseite `index.html`
- **Website-Updates & Versionschronik:** `website-updates.html` (Verlauf 1.0 → 1.1; detailliert in `CHANGELOG.md`)
- QR-Anmeldung mit eigenem Formular und WhatsApp: `anmelden.html`
- Zwei druckbare QR-Karten: `qr-karten.html`

- Community (Deutsch): `community.html`
- Community (English): `community-en.html`
- Mitgliedskarten: `mitglieder.html`
- **Owner Lounge:** `mitglieder-admin.html` – alle Mitglieder, Kartenfreigaben, manueller Zugang, QR-Vorschau, Mail-Übersicht
- **Private Team Lounge:** `team-talk.html` – Gruppenchat, Gesprächsräume, Jitsi-Audio/Video und Owner-Freigaben für Co-Owner, Managerin und Supporter.
- Geschützte Team-Zentrale für Beiträge und Aufgaben: `hub-admin.html`
- Eishallen-Links: `eishallen.html`
- Jahresrückblick: `jahresrueckblick.html`
- Datenschutzhinweise: `datenschutz.html`

## Funktionen

### Öffentlich

- Neuigkeiten, Ausflüge und freiwillige Challenges von der Leitung
- Event-Anfragen mit Vornamen und privatem Link zur Prüfung des Bearbeitungsstatus
- Einfache Community-Umfragen (eine Stimme pro Browser, **nicht manipulationssicher**)
- Anonyme Ideen-/Feedbackbox (bitte keine privaten oder identifizierenden Details eingeben)
- Galerie ausschließlich mit geprüften Foto-Freigaben
- Saison-Countdown, Crew-Geschichte, Jahresrückblick, Sicherheitstipps
- Regionale Eishallen-Suchlinks (keine Live-Öffnungszeiten oder garantierten Preise)
- Digitale aktive/passive Mitgliedskarten mit QR-Code und freiwilligen Abzeichen

### Intern

- Owner: private Mitgliedsanträge, Gesprächsnotizen und Mitgliedshistorie
- Owner: Event-Anfragen, Teilnahme-/Anwesenheitsstatus, Feedback, Badge-Vergabe, Teamrollen
- Freigeschaltetes Team: Beiträge, Umfragen, Aufgaben, Checklisten und Ausrüstungsverleih
- Ausflugskostenrechner mit selbst eingegebenen Schätzpreisen
- Benachrichtigung für neue Community-Anfragen **während das Dashboard geöffnet ist**; kein iOS-Hintergrund-Pushdienst
- Zwei iPhone-Startbildschirm-Verknüpfungen über `owner.webmanifest` und `hub.webmanifest`

## Technik

- Statische Dateien auf GitHub Pages
- Supabase für Datenbank, Authentifizierung und Row-Level Security (RLS)
- `assets/frost-members-config.js` enthält ausschließlich Projekt-URL und **öffentlichen** Publishable Key.
- Passwörter, geheime API-Keys und service-role Keys **niemals** im Repository oder im Chat weitergeben.
- Owner- und Team-Rechte werden in der Datenbank kontrolliert, nicht nur über Schaltflächen.
- Das separate `organisation.html` nutzt weiterhin einen lokal verschlüsselten Plan. Dessen gemeinsames Passwort ist unabhängig von den personenbezogenen Supabase-Konten; das gemeinsame Passwort darf nicht veröffentlicht werden.

## Entwicklung und Prüfungen

GitHub Actions startet nach jedem Push die Integritätsprüfung:

```bash
node tools/check-frost-site.mjs
```

Geprüft werden lokale Links, JavaScript-Syntax, wichtige HTML-Elemente, fehlende Dateien, alte Shop-Links und offensichtliche Geheimnisse in der Browser-Konfiguration.

**Grenzen der Prüfung:** Ohne echte Test-Accounts und Live-Browser werden Login, Mitgliedsanträge, Benachrichtigungen, Karten-QR, Löschvorgänge, E-Mail-Empfang und mobile Darstellung nicht vollständig Ende-zu-Ende verifiziert. Die Integritätsprüfung ersetzt weder Sicherheits-Audit noch Datenschutzprüfung.

Eine manuelle Test-Checkliste steht in `MITGLIEDER-SETUP.md`. Der ehemalige Kleidungsshop wurde entfernt und soll entfernt bleiben.

## Schutz von Minderjährigen und Datenschutz

Nur notwendige Angaben verarbeiten, grundsätzlich keine Nachnamen, Geburtsdaten, Fotos ohne Freigaben oder privaten Kontaktdaten speichern. Niemals Kartenlinks veröffentlichen, denn Personen mit dem Link können die Kartendaten abrufen.

Die öffentlich sichtbaren Datenschutzinformationen sind ein **Entwurf**, keine bestätigte rechtlich vollständige Erklärung. Es fehlen noch die gesetzlich nötigen vollständigen Angaben zur verantwortlichen volljährigen Person und eine Prüfung der Rechtsgrundlagen, Aufbewahrungsfristen, Dienstleister und Einwilligungen. Erwachsene Verantwortliche vor weitergehender Nutzung einbeziehen.

## Zwei QR-Karten statt einer überladenen Startseite

- **QR-Karte 1 – Anmeldung:** `https://raphifrost.github.io/frost-skaters-landing/anmelden.html`. Zeigt direkt das datensparsame Anmeldeformular (nur Vorname) und WhatsApp als Kontaktalternative. Nach dem Absenden wird wie beim bestehenden Mitgliedersystem ein persönlicher Karten-Link erzeugt.
- **QR-Karte 2 – Website:** `https://raphifrost.github.io/frost-skaters-landing/`. Zeigt die gewohnte öffentliche Website, **ohne Anmeldeformular und ohne WhatsApp-Anmeldeblock**. Wer beitreten möchte, kann selbst die separate Anmeldeseite öffnen.
- Unter `qr-karten.html` sind beide mit dem echten Logo gestalteten QR-Karten druckbar. Die QR-Matrizen sind statisch im Projekt hinterlegt und benötigen keinen QR-Generator-Drittanbieter.
- `mitglieder.html` und die bestehenden privaten Mitgliedskarten bleiben weiterhin erreichbar. Diese beiden neuen Werbe-QR-Karten sind **keine** persönlichen Mitgliedsausweise.

Hinweis: Nach Änderungen an den URLs müssen neue QR-Codes erzeugt und neue physische Karten gedruckt werden. Vor dem Druck immer beide QR-Codes testen.

## 👑 Owner Lounge & GMX-Benachrichtigungen

Die Owner Lounge ist die bestehende geschützte Mitgliederdatenverwaltung `mitglieder-admin.html`, neu mit Mitgliedergalerie, interaktiver Kartenvorschau und übersichtlicher Liste. Alle bereits vorhandenen Mitgliederdatensätze bleiben gespeichert. Nur der freigeschaltete Owner sieht Namen, Anträge und private Terminnotizen.

Die digitalen Mitgliedskarten auf `mitglieder.html?code=…` haben ein neues Frost-Skaters-Design mit persönlichem QR-Code. Sie bleiben auch für bestehende Mitgliedskarten gültig und können als PDF gedruckt werden.

Für automatische E-Mail-Benachrichtigungen nutzt Supabase einen Datenbank-Trigger mit `pg_net` und FormSubmit. Nach einer Antragstellung wird eine Info an die auf der Website hinterlegte GMX-Adresse beauftragt. Nach Freigabe erhält der Owner eine zweite Benachrichtigung mit dem **privaten digitalen Karten-Link**, der die gestaltete Karte mit QR-Code öffnet. **Es wird keine PNG- oder PDF-Datei als E-Mail-Anhang verschickt**. Das System muss einen bestätigten FormSubmit-Empfänger haben; technisch angenommen ist nicht gleich vom Postfach empfangen. Die E-Mail darf nur an die betreffende Person weitergeleitet werden und ist nicht für öffentliche Verteiler geeignet.

Die Website speichert keinen GMX- oder SMTP-Zugang und benötigt auch keinen. Neue Test-Mails können im Spamordner liegen. Bestehende Anträge werden durch die neue Automatik nicht erneut benachrichtigt. Bei sehr vielen unaufgeforderten Anträgen begrenzt eine einfache Schutzregel die Anzahl neuer E-Mail-Aufträge.

## 🎙️ Team Lounge – nur für freigeschaltete Teammitglieder

- Direktlink: `https://raphifrost.github.io/frost-skaters-landing/team-talk.html`
- Vier Rollen: Owner, Co-Owner, Managerin und Team-Supporter. Die Freigabe erfolgt in der Team Lounge durch den Owner mit Supabase-Benutzer-ID, Vorname und Rolle.
- Jede Person registriert ein eigenes Konto und bestätigt ggf. die E-Mail. Bis zur Owner-Freigabe ist kein Zugriff auf private Teamdaten möglich.
- Alle freigeschalteten Teamrollen dürfen Gesprächsräume erstellen, Chatnachrichten senden und gemeinsame Audio-/Video-Gespräche über `meet.jit.si` öffnen. Der Teamchat nutzt Supabase Realtime mit RLS.
- Team-Supporter erhalten **keine** zusätzlichen Rechte im Owner-/Community-Adminsystem; diese bleiben beim Owner bzw. den schon zugelassenen Co-Owner-/Manager-Rollen.
- Der Owner kann Team-Zugänge entziehen und Gespräche mitsamt dem Chatverlauf löschen. Eigene Nachrichten können von den jeweiligen Absendern entfernt werden. Es ist keine automatische Aufbewahrungsfrist konfiguriert.
- Die neue Team Lounge wird nicht über öffentliche Menüs beworben; die HTML-Login-Seite ist technisch dennoch direkt aufrufbar. Nur RLS und Teamfreigaben schützen die Daten.
- Für Mikrofon, Kamera und Bildschirmfreigabe öffnet sich der externe Anbieter Jitsi erst nach einem bewussten Klick. **Ein weitergegebener Videolink kann auch Personen außerhalb des Teams einlassen.** Im Jitsi-Meeting deshalb Lobby oder entsprechende Zugangsbeschränkungen aktivieren. Die erste Person, die ein Meeting startet, benötigt ggf. einen Jitsi-kompatiblen Account; Jitsi begrenzt `meet.jit.si`-Meetings derzeit auf 95 Minuten.
- Jitsi wird **nicht** innerhalb des GitHub-/Supabase-Datenschutzbereichs betrieben. Die Audio-/Video-Verbindungen laufen über den externen Anbieter; dessen Datenschutzbedingungen beachten. Keine Gespräche heimlich aufnehmen.
- Automatische Code- und öffentliche Zugriffsprüfungen laufen via GitHub Actions. Ein vollständiger browserbasierter Live-Test mit echten Teamkonten steht vor dem produktiven Einsatz noch aus.

## ❄️ Startseiten-Intro mit eigenem Eis-Sound

- Beim ersten Besuch der öffentlichen Frost Skaters Startseite pro Browser-Tab öffnet sich ein kurzer Willkommensbildschirm mit dem bestehenden Logo, Eisglanz und Polarlicht-Effekten.
- Besucher wählen **„▶ Intro mit Sound starten“** oder **„Ohne Ton weiter →“**. Beim Start gibt es eine circa 3,5-sekündige Animation mit einem selbst synthetisierten Eis-/Elektro-Jingle aus der Web Audio API. Die Lautstärke ist bewusst moderat.
- **Kein Ton ohne Antippen!** Das ist bei iPhones und modernen Browsern technisch erforderlich und verhindert unerwünschte Autoplay-Geräusche.
- Auf der Startseite steht außerdem der kleine Button **„❄️ Intro nochmal abspielen“**, sodass man die Animation jederzeit erneut starten kann.
- Direktaufrufe auf einen Abschnitt (`#…`), Nutzer mit reduzierter Animation und Wiederbesuche im gleichen Tab öffnen sofort die Website. `?intro=1` zeigt das Intro zum Testen unabhängig von der Session; `?intro=0` überspringt es.
- Der Sound wird lokal im Browser erzeugt, ohne Downloads, externe Player, personenbezogene Daten oder urheberrechtlich geschützte Musik. Es gibt einen sichtbaren Skip-Button und man kann per Esc schließen.
- Code und Animation: `assets/frost-intro.js` und `assets/frost-intro.css`. Bestehende Anmeldungen, Owner Lounge und Team Lounge bleiben unverändert.

## 📅 Geschützter Team-Kalender

- URL: `https://raphifrost.github.io/frost-skaters-landing/team-kalender.html`. Die Seite ist nicht im öffentlichen Menü verlinkt, sondern erst aus der eingeloggten Team Lounge und den internen Dashboards erreichbar.
- Nur Teamkonten mit vom Owner freigeschalteter Rolle (Owner, Co-Owner, Managerin oder Team-Supporter) dürfen den Kalender lesen. Die Supabase-Tabelle `frost_team_calendar` hat Row Level Security (RLS).
- **Owner, Co-Owner, Managerin:** neue Termine anlegen, bearbeiten, absagen oder entfernen. **Supporter:** dürfen Termine ansehen, aber nicht schreiben oder löschen. Normale Mitglieder und anonyme Besucher erhalten keinen Zugriff.
- Monatsübersicht mit Mo–So, Tagesauswahl, Kategorie-Filter (Ausflug, Teamtreffen, Training, sonstige), Anzeige geplanter/bestätigter/abgesagter Termine, „Demnächst“-Liste und Nächster-Termin-Karte.
- Termine speichern Datum, optional Uhrzeit (lokale Uhrzeit in Deutschland), Ort, Kurzbeschreibung, Status, Ersteller-ID und Zeitstempel. Das Formular speichert keine E-Mail-Adressen von Mitgliedern. Sensible/private Angaben gehören nicht in Termintexte.
- Die Berechtigungen werden serverseitig durch PostgreSQL-RLS geprüft; das Ausblenden der Schaltflächen ist nur Oberfläche. Echtzeit-Änderungen werden mit Supabase Realtime und einer regelmäßigen Aktualisierung synchronisiert.
- **Keine erfundenen Einträge:** Der Kalender startet mit tatsächlichen, gespeicherten Terminen. Ausflüge aus den öffentlichen Eventseiten werden nicht ohne ausdrückliche Planung zu verbindlichen Team-Terminen erklärt.
- Für den produktiven Einsatz sollten Termine, Löschung/Aufbewahrung und rechtliche Anforderungen mit einer volljährigen verantwortlichen Person geklärt werden.

## 🤖 Frost FAQ-Helfer – kostenloser Fragen-Chat für Besucher

- Der Button **„❄️ Fragen?“** öffnet einen kleinen, mobilfreundlichen FAQ-Chat auf den öffentlichen Frost-Skaters-Seiten (Startseite, Anmeldung, Mitgliedskarten, Events, Training, Leitung, Community, Eishallen, Rückblick, Datenschutz und QR-Druckkarten). **Nicht** auf Team Lounge, Kalender oder Owner-Admin.
- Besucher können häufige Fragen anklicken oder maximal 180 Zeichen als Frage eingeben. Der Helfer erkennt Stichwörter und beantwortet nur bekannte Themen: Aufnahme, Kennenlernen, Mitgliedskarte, Kartenstatus, Heilbronn-Ausflug, Kosten, Ausrüstung, Training, Eltern, Datenschutz und Kontakt. Er zeigt zu jeder passenden Antwort konkrete öffentliche Links.
- **Kein generatives KI-Modell, kein externer Anbieter, kein Geld, kein Account, kein API-Schlüssel**: Text wird nur im Browser verarbeitet. Es werden weder Eingaben noch Verlauf an Supabase, GMX oder externe Dienste gesendet oder in Browser-Speichern gespeichert.
- Unbekannte Fragen erhalten eine ehrliche Standardantwort mit Verweis auf die Leitung. Keine Behauptungen über Freigabe, ungeprüfte Events oder private Karten.
- Der Helfer verwendet ausschließlich auf der bestehenden Website belegte beziehungsweise bereits abgestimmte Aussagen. **Wichtig:** Der derzeitige Veranstaltungstext verweist auf Heilbronn am **3. Januar 2027**; wenn sich dieser Termin ändert, müssen auch die festen FAQ-Antworten in `assets/frost-faq.js` angepasst werden.
- FAQ-Dateien: `assets/frost-faq.js` (Fragen und feste Antworten) und `assets/frost-faq.css` (Anzeige). Die automatischen Prüfungen `tools/check-frost-faq.mjs`, `tools/check-frost-site.mjs` und `tools/check-frost-live.mjs` kontrollieren häufige Fragen, nur öffentliche Links, die Einbindung und die Live-Dateien.
- In der Datenschutzerklärung gibt es einen eigenen Hinweis zur lokalen FAQ-Verarbeitung. Keine Passwörter, privaten Karten-Codes oder personenbezogenen Notizen in den FAQ-Chat eingeben; Kontaktaufnahme per WhatsApp erfolgt ausschließlich nach bewusstem Wechsel auf die Anmeldeseite.

## ✦ Frost Skaters 1.1 — The Frost Edition

- **Website-Version**: 1.1, veröffentlicht als Update vom 15. Oktober 2026.
- **Neue Release-Seite**: \`website-updates.html\` mit großem Frost-1.1-Motiv, Aurora-/Eisglas-Design, Versionsverlauf von 1.0 bis 1.1 und Filtern für „Neu in 1.1“ und „Schon dabei“.
- **Startseite erneuert**: \`assets/frost-v11-home.css\` und aktualisierte \`index.html\` zeigen den modernen Hero, einen klaren 1.1-Hinweis, überarbeitete Funktionskacheln, eine kompakte Release-Vorschau und eine aufgewertete Community-Vorstellung.
- **Zusammenhängende Navigation**: Öffentliche Hauptseiten verlinken die Website-Updates, sodass man die Version leicht findet. Interne Zugriffe werden nicht beworben.
- **Kein externer Tracking-/Designservice** für die Release-Grafik: Die dekorativen Orbital-/Eis-Effekte sind reines CSS; das kleine \`assets/frost-updates.js\` steuert nur Filter, Lesefortschritt und Kopieren des Website-Links.
- **Barrierearme Darstellung**: Geräte mit reduzierten Animationen bekommen eine statische Variante, die mobile Darstellung nutzt kleinere Typografie und die Buttons sind mit der Tastatur erreichbar.
- **Vorhandene Funktionen bleiben unverändert**: Frost FAQ, Intro, QR-Karten, Anmeldung, Team Lounge, Kalender und Admin-Werkzeuge sind **nicht erst in 1.1 entstanden**; die neue Updates-Seite unterscheidet diese bestehenden Funktionen von tatsächlich neuen Änderungen.
- **Release-Dokumentation**: \`CHANGELOG.md\`. Aktualisiere künftig sowohl die sichtbare Update-Seite als auch den Changelog, ohne unbestätigte Funktionen als live zu bezeichnen.
- **Prüfungen**: \`tools/check-frost-site.mjs\` und \`tools/check-frost-live.mjs\` prüfen Seite, Versionsangaben, Links, Assets und die anonyme Zugriffssperre in Supabase. Live-Rendering auf echten iPhones muss bei Bedarf noch separat geprüft werden.


## 👑 Owner Control Center 1.1 – Premium-Design

- Private Besitzer-Verwaltung weiterhin unter `mitglieder-admin.html` (direkter Link); **kein zusätzlicher Admin-Link in der öffentlichen Website-Navigation**.
- Neues Frost-/Aurora-Layout mit Owner-Login-Karte, animiertem Markenmotiv, großzügigem Dashboard und übersichtlichen Bereichen für Mitglieder, Anträge, manuelle Karten und GMX-Versandübersicht.
- Nach dem Owner-Login gibt es ein privates **Control Center** mit Live-Zahlen für Anträge, aktive Karten und weitere Status sowie vier Schnellzugriffen (Anträge, Karten erstellen, Team-Kalender, Benachrichtigungen).
- Große Mitgliedskacheln mit Statusfarben und den bisherigen Aktionen für Kartenvorschau, persönliche Links, Freigaben, Sperren, Löschung und private Gesprächsnotizen.
- Neue Optik ist responsiv und berücksichtigt reduzierte Animationen. `assets/frost-owner-v11.css` ist nur auf der Owner-Lounge-Seite eingebunden.
- Das optionale `assets/frost-owner-v11.js` formatiert nur bereits sichtbare Summenzahlen, Tagesgruß und einen lokalen Zeitpunkt auf dem eingeloggten Dashboard. **Keine eigenen Datenbankabfragen, Speicherung oder Tracking.**
- **Unveränderte Zugriffsrechte:** Bestehendes Supabase-Login, Owner-Abfrage und RLS in `assets/frost-members-admin.js` bleiben unverändert. Verstecken von Oberfläche ist nicht der Zugriffsschutz.
- `tools/check-frost-site.mjs` prüft die vorhandenen wichtigen IDs und Funktionen; `tools/check-frost-live.mjs` stellt sicher, dass das neue Design veröffentlicht ist und die Seite vor Anmeldung weiterhin nur den Login zeigt. Echte Owner-Login-/Bearbeitungs-Tests wurden nicht durchgeführt.

## 👑 Owner-Tools 3, 4 und 12 – Rollen, Protokoll & System-Monitor

**Erreichbar ausschließlich nach Owner-Login** auf `mitglieder-admin.html` unter „Owner Tools“. Der vorhandene Login und alle Owner-Mitgliederfunktionen bleiben bestehen.

### 3. Teamrechte verwalten

- Eingeloggter Owner darf registrierte Benutzer-IDs als **Co-Owner**, **Managerin/Manager** oder **Supporter** freischalten, vorhandene Rollen verändern und Zugänge entziehen.
- Datenquelle: die bereits vorhandene, durch **Supabase RLS auf Owner-Zugriff beschränkte** Tabelle `public.frost_hub_staff`. Die Owner-Rolle selbst kann **nicht** über Teamrollen vergeben werden; die Datenbank verhindert zudem nachträgliches Ändern der Team-Benutzer-ID oder das Eintragen vorhandener Owner-Konten als zusätzliche Staff-Mitglieder.
- Co-Owner und Managerin/Manager haben aktuell dieselben Team-Bearbeitungsrechte (Team Hub und Kalender), Supporter dürfen im Teamchat teilnehmen und im Team-Kalender nur lesen. Kein Teamkonto darf dadurch private Owner-Mitgliedskarten verwalten.
- Neue Teamkonten müssen sich zunächst mit eigenen Zugangsdaten bei der Team Lounge registrieren und dem Owner ihre **Benutzer-ID**, niemals ihr Passwort, mitteilen. Die Staff-Verwaltung erzeugt keine Konten und verschickt keine Einladungsmails.

### 4. Owner-Aktivitätsprotokoll

- Tabelle `public.frost_owner_activity` mit INSERT/UPDATE/DELETE-Triggern auf Mitglieder und Teamrollen. Protokolliert Kartenanträge, Kartenerstellung, Statuswechsel, Kartenrollenwechsel, Löschen von Karten sowie Staff-Zugänge, Rollen- und Anzeigenamensänderungen.
- Der neue Verlauf startet ab Einrichtung des Protokolls; bereits existierende Einträge der bisherigen `frost_hub_member_history` werden getrennt angeboten, wenn vorhanden. Es wurden keine alten Ereignisse erfunden oder künstlich zurückdatiert.
- Eigentümerzugriff ausschließlich über RLS + SELECT; **keine direkten Client-Schreibrechte** auf das Protokoll. Keine Passwörter, E-Mails, Kartencodes, Gesprächsnotizen oder Namen im neuen Protokoll. Eine verknüpfte Mitglieds-ID wird bei Löschung der Mitgliedskarte entfernt.
- Einträge älter als 180 Tage werden **bei späteren protokollierten Ereignissen** bereinigt; ohne neue Ereignisse gibt es noch keinen eigenständigen nächtlichen Löschjob. Speicherfristen des alten Bestandsprotokolls müssen separat geprüft werden.

### 12. System-Monitor

- Öffentliche GitHub-Pages-Seite via **same-origin HTTP HEAD**; tatsächliche HTTP-Antwort wird als „Erreichbar“ oder „Nicht erreichbar“ angezeigt.
- Geschützte Supabase-Owner-Abfrage prüft, ob die Datenbank/API aus dem aktuellen Browser über die bestehende Authentifizierung antwortet. Wird der Owner-Zugang nachträglich serverseitig aberkannt, beendet die Seite die Sitzung, sobald die Owner-Abfrage dies eindeutig bestätigt.
- Versionskarte zeigt die bekannte **Version 1.1 und deren Release-Datum** aus der Website-Chronik, **nicht** eine live vom GitHub-Deployment gelesene Aktualisierungszeit.
- Automatischer Check höchstens etwa alle 60 Sekunden, solange die Owner Lounge geöffnet und sichtbar ist; zusätzlich manuell. Keine dauerhafte Uptime-Messung, kein Echtzeit-Überwachungssystem, kein Monitoring von GMX-Mails, Jitsi oder Nutzergeräten.
- Die UI-Erweiterung `assets/frost-owner-tools.js` nutzt die bereits authentifizierte Supabase-Sitzung und speichert keine neuen Zugangsdaten oder Besucheranalysen.

**Tests:** `node tools/check-frost-owner-tools.mjs` prüft Rollenvalidierung, Aktionsbezeichnungen und geschützte UI-Verknüpfungen; GitHub Actions führt außerdem statische und anonyme Live-Prüfungen durch. Echt authentifizierte Owner-Aktionen sind ohne ein freigegebenes Testkonto **nicht** End-to-End ausgeführt worden.


## ✦ Frostverse · 15 Upgrades in Version 1.1

**Jetzt öffentlich:** https://raphifrost.github.io/frost-skaters-landing/frostverse.html

Die neue Frostverse-Welt verbindet Event Launch, Teamkarten (nur bereits öffentlich genannte Leitung), Hall of Frost, Expedition, Frost TV, Skate Customizer, Frost Audio, Frost Effects, Time Capsule und Season Transformation. Frost Command ergänzt eine lokale Command-Palette auf der Startseite, im Frostverse und auf der Owner-Seite.

**Privat bleibt privat:** Der neue Owner God Mode nutzt ausschließlich das vorhandene `mitglieder-admin.html`-Login und zeigt nur schon freigegebene Daten an. Der Geheime Team-Hub nutzt weiterhin das rollenbasierte `team-talk.html`-Login mit Supabase RLS. Die Frost ID Pro ist eine optionale, bewegliche Darstellung der bereits per Code geprüften Mitgliedskarte; die Kartenprüfung bleibt unverändert.

**Datenschutz:** Die lokale Time Capsule speichert nur auf dem jeweiligen Gerät in `localStorage` (nicht verschlüsselt); Saison-Designpräferenzen werden ebenfalls nur dort gespeichert. Kein Standortzugriff, Audio erst nach Klick, keine externen Such- oder KI-Anfragen durch Frost Command. Die öffentlichen Crew-Karten enthalten keine privaten Teamkonto-Daten.

**Wichtige Grenzen:** Frost TV zeigt redaktionelle Text-Slides, keinen echten Video-Livestream. Die Expedition Map ist eine gestalterische Regionsauswahl, keine präzise Straßenkarte. Beim Event-Countdown wird das bekannte Datum verwendet, nicht eine unbestätigte Treffzeit. Skate Customizer erstellt ein fiktives 2D-Motiv mit PNG-Export, keinen realen Kaufartikel.

**Tests:** `node tools/check-frostverse.mjs` prüft 89 Versions-/Sicherheits-/Integrationsbedingungen zusätzlich zu den bestehenden Website-, Owner- und Live-Tests. Reale Besitzer- und Teamkonto-Aktionen sowie browserabhängige PNG-Ausgaben erfordern noch manuelle QA.

**Pflege:** Aktualisiere bei Rollenwechseln sowohl `leitung.html` als auch `frostverse.html`. Neue Frost TV-Slides nur aus wirklich bestätigten Quellen ergänzen. Datenschutztext ist kein Ersatz für die erforderliche Prüfung durch eine tatsächlich verantwortliche erwachsene Person.
