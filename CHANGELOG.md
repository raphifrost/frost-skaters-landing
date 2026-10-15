# ❄️ Frost Skaters – Website-Änderungen

Aktuelle öffentliche Website-Version: **1.1**

Öffentliche Release-Übersicht: [Website-Updates](https://raphifrost.github.io/frost-skaters-landing/website-updates.html)

## Version 1.1 – 15. Oktober 2026

**The Frost Edition / Neuer Look. Gleiche Crew.**

### Neu in dieser Version
- Deutlich überarbeitete **Startseite** mit großem Frost-Hero, Version-1.1-Label, Eis-/Aurora-Akzenten, erweiterten Feature-Karten und neu gestalteter Team-Vorstellung.
- Eigene öffentliche **Website-Updates-Seite** \`website-updates.html\` mit Versionsverlauf 1.0 → 1.1, klarer Trennung von neuen und bereits vorhandenen Features und Filterbuttons.
- Aktualisierte öffentliche Navigation: sichtbarer Zugang zu **Version 1.1** und dem Änderungsverlauf.
- CSS-basierte dekorative 1.1-Release-Grafik, die keine externe Grafikbibliothek oder zusätzlichen Trackingdienst benötigt.
- Responsives Layout für Handy und Desktop; berücksichtigt reduzierte Animationen und Tastaturnavigation.
- Neue GitHub-Actions-Prüfungen für die Release-Seite, Versionsbezeichnungen und das unveränderte Berechtigungssystem.

### Bereits vorhandene Funktionen bleiben bestehen
- Eislauf-Events, Anmeldung über Vorname und freiwillige WhatsApp-Kontaktaufnahme.
- Persönliche Frost-Skaters-Mitgliedskarten mit Code/QR und Owner-Freigabe.
- Frost FAQ-Helfer (stichwortbasierte Antworten ohne externes KI-Backend).
- Freiwilliges Homepage-Intro mit selbst erzeugtem Sound nach antippen.
- Interne Team Lounge, Team-Kalender und Verwaltungsseiten mit eigenen Berechtigungen.

**Diese bereits vorhandenen Funktionen sind keine neu erfundenen Features von 1.1.** Sie werden im Changelog korrekt als bestehender Funktionsumfang ausgewiesen.

## Version 1.0 – Basisversion

Der erste öffentliche Web-Auftritt für Frost Skaters: Vorstellung der Community, gemeinsame Aktivitäten, Kontakt und Teilnahme. Das genaue erste Veröffentlichungsdatum wird nicht behauptet.

---

**Für zukünftige Updates:** Ergänze hier und auf \`website-updates.html\` nur Änderungen, die wirklich umgesetzt und getestet wurden. Nicht freigegebene Veranstaltungstermine, unangekündigte Termine und sensible Team-Daten nicht öffentlich machen.

### Owner Lounge / Control Center 1.1

- Innerhalb von Version 1.1 zusätzliches Premium-Redesign der geschützten Owner Lounge: Aurora-Startmotiv, Login-Karte, Live-Statistik-Kacheln, Schnellzugriffe, Mitgliedskarten-Kacheln und aufgeräumte Verwaltung.
- Bestehende Mitglieder-, Antrags-, Karten-, GMX- und Gesprächsfunktionen bleiben erhalten; Owner-Sicherheit/RLS unverändert.
- Neue Dateien: `assets/frost-owner-v11.css`, `assets/frost-owner-v11.js`. Keine neuen Datenbanktabellen oder Rechte.

### Zusätzliche Owner-Tools 3, 4 und 12 – 15. Oktober 2026

- **Team-Rechte verwalten:** Im eingeloggten Owner Control Center werden registrierte Teamkonten mit Co-Owner-, Manager/in- oder Supporter-Rolle freigeschaltet, bearbeitet oder entfernt. Serverseitige Owner-RLS prüft Zugriffe.
- **Aktivitätsprotokoll:** Neue Kartenanträge, Kartenerstellung, Status- und Rollenänderungen sowie Teamzugangsänderungen werden ab Einrichtung protokolliert. Owner-exklusiv; keine Namen, privaten Kartenlinks, Gesprächsnotizen oder Passwörter in neuen Protokolleinträgen; Zuordnungen gelöschter Karten entfallen.
- **System-Monitor:** Echte Erreichbarkeit von GitHub Pages und der geschützten Supabase-Owner-Abfrage, regelmäßige Checks beim geöffneten Dashboard und manuelle Aktualisierung. Versionskarte zeigt das **1.1-Release-Datum**, keine erfundene letzte GitHub-Deployment-Zeit.
- Datenschutztext und automatisierte RLS-/Link-/UI-Prüfungen ergänzt. Das bestehende Login- und Mitgliederverwaltungssystem wurde nicht ersetzt.
- Einschränkung: Keine Live-Prüfung mit einem echten Owner-Testkonto; ein umfassender Bedienungstest muss nach dem Login erfolgen.


### Frostverse / 15 neue Erlebnis-Funktionen – 15. Oktober 2026

**Website-Version bleibt 1.1.** Diese Erweiterung führt die früheren Ideen Nummer 28–42 als zusammenhängende Frostverse-Erlebniswelt aus.

- **28 Owner God Mode:** Neues, ausschließlich im bereits durch Owner-Login geschützten Dashboard eingeblendetes Kommando-Dashboard; spiegelt die vorhandenen aktiven Karten, offenen Anträge und Systemprüfung. Keine neuen Berechtigungen oder separaten Datenbankzugriffe.
- **29 Frostverse:** Öffentliche interaktive Portal-Seite \`frostverse.html\` mit sechs Themenportalen, Neuigkeiten, Expediton, Studio, Crew und Zukunftskapsel; Einsteig auf der Startseite.
- **30 Frost ID Pro:** Opt-in-3D-Hologrammeffekt der bestehenden, nur nach Codeprüfung freigegebenen Member Card. Kein neuer Karten-Code oder öffentliches Mitgliederdirectory.
- **31 Frost Command:** Barrierearme lokal laufende Seitensuche; mit Strg+K/⌘K erreichbar. Private Owner-Navigation wird nur eingeblendet, wenn das bestehende Dashboard bereits freigeschaltet ist; ohne eigene Login- oder Datenbankrechte.
- **32 Event Launch Mode:** Datumscountdown bis zum 03.01.2027, nicht bis zu einer unbestätigten Abfahrtszeit.
- **33 Frost Crew Cards:** Öffentliche stilisierte Karten der bereits veröffentlichten Leitung (Raphael, Alina, Ilayda); keine privaten Accounts.
- **34 Hall of Frost:** Dokumentierte Community- und Website-Meilensteine, keine frei erfundenen Leistungen.
- **35 Frost Audio Experience:** Einzeln generierte kurze Web-Audio-Sounds nach ausdrücklichem Ein- und Ausschalten, ohne Sprachaufnahme.
- **36 Frost Effect Engine:** Freiwilliger Schneeflockeneffekt und CSS-Aurora. Respektiert „Bewegung reduzieren“.
- **37 Geheimer Team-Hub:** Aufgewertetes Inner-Circle-Portal *innerhalb* der bereits authentifizierten Team Lounge; die bestehenden rollenbasierten Bereiche für Owner, Co-Owner/Manager und Supporter bleiben serverseitig eingeschränkt.
- **38 Frost Expedition Map:** Schematische, ausdrücklich nicht maßstabsgetreue Regionsübersicht mit optionalen Eishallensuchlinks. Kein GPS oder Tracking.
- **39 Frost Time Capsule:** Freiwillige lokale Nachricht + Zieltermin via localStorage; Nachricht wird nicht an Supabase übertragen, nicht verschlüsselt, jederzeit löschbar.
- **40 Frost TV:** Navigierbare News-Slides zu bereits öffentlichen Frost-Informationen, kein behaupteter Video-Livestream.
- **41 Skate Customizer:** Virtuelle 2D-Skate-Illustration mit Farbwahl, Presets und lokalem PNG-Export. Kein Online-Shop/realer Produktionsservice.
- **42 Season Transformation:** Vier visuelle Jahreszeiten-Themes, optional automatisch nach Kalendermonat oder lokal gespeicherte Designwahl.

Für die Erweiterung hinzugefügt/überarbeitet: \`frostverse.html\`, \`assets/frostverse.css\`, \`assets/frostverse.js\`, \`assets/frost-command.css\`, \`assets/frost-command.js\`, \`assets/frostverse-teaser.css\`, \`assets/frost-id-pro.css\`, \`assets/frost-id-pro.js\`, \`assets/frost-god-mode.css\`, \`assets/frost-god-mode.js\`, \`assets/frost-team-portal.css\`, angepasste öffentliche/private Seiten und Datenschutzhinweise.

Die neue \`tools/check-frostverse.mjs\` prüft 89 Integrationsverträge (Elemente, Skripte, relative Links, Schutzgrenzen und Datenschutz). **Reale Browser-Interaktion mit echten Owner-/Team-Accounts wurde nicht automatisch getestet.** Der tatsächliche Erfolg einzelner Funktionen kann je nach Browser variieren (etwa PNG-Export und localStorage); manche Beiträge müssen mit echten, freigegebenen Inhalten ergänzt werden.
