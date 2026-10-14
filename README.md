# ❄️ Frost Skaters

Offizielle GitHub-Pages-Website der unabhängigen Eislauf-Community **Frost Skaters**.

- Öffentliche Startseite: `index.html`
- QR-Anmeldung mit eigenem Formular und WhatsApp: `anmelden.html`
- Zwei druckbare QR-Karten: `qr-karten.html`

- Community (Deutsch): `community.html`
- Community (English): `community-en.html`
- Mitgliedskarten: `mitglieder.html`
- Geschützter Owner-Bereich für Mitgliedskarten: `mitglieder-admin.html`
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
