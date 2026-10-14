# Frost Skaters – Einrichtung und Tests

**Aktueller Stand:** GitHub-Pages-Repository `raphifrost/frost-skaters-landing`, Supabase-Projekt `chjkciknwutqdvefxhnl`. Die Owner-Rolle ist für genau ein existierendes Konto freigeschaltet. **Kein weiterer Owner-Account und keine zweite Datenbank notwendig.**

## 1. Geschützte Zugänge

- Mitgliederverwaltung: `mitglieder-admin.html`
- Team-Zentrale: `hub-admin.html`
- Öffentlichkeit: `community.html`, `mitglieder.html`
- Teammitglieder registrieren sich mit einer eigenen E-Mail und einem eigenen, geheimen Passwort; der Owner genehmigt sie über ihre Supabase Benutzer-ID. Nur der Owner darf Team-Berechtigungen vergeben.
- Der gemeinsame verschlüsselte `organisation.html`-Plan hat einen getrennten Passwortschutz und gewährt **keinen** Zugriff auf Supabase-Daten.

Falls eine E-Mail-Bestätigung auf `localhost:3000` zeigt, muss unter Supabase Authentication → URL Configuration die korrekte Site-/Redirect-URL freigegeben werden. Gegebenenfalls war die Bestätigung trotzdem erfolgreich. Keine Passwörter per Chat verschicken.

## 2. Manuelle Prüfung (Testdaten und Vornamen, keine echten privaten Daten)

1. Öffentliche Startseite, Community, englische Version, Datenschutz und Eishallen-Finder öffnen.
2. Als Besucher eine Community-Idee ohne Namen absenden. Im Owner-Dashboard prüfen, ob sie ausschließlich im geschützten Posteingang erscheint.
3. Als Owner einen News-Beitrag und ein Event als Entwurf anlegen. Öffentlich darf der Entwurf nicht erscheinen. Dann freigeben und Verfügbarkeit prüfen.
4. Event mit erfundenem Vornamen anfragen. Privaten Beleg-Link speichern. Owner bestätigt. Den Status über denselben Link kontrollieren.
5. Eine Umfrage veröffentlichen, als Besucher abstimmen und die Ergebnisanzeige überprüfen. Bei demselben Browser darf eine zweite Stimme nicht gespeichert werden. Die Abstimmung ist trotzdem nicht fälschungssicher.
6. Als Owner Aufgaben/Checklisten/Ausrüstungsverleih und Kostenrechner testen; als Co-Owner mit eigenem freigeschalteten Account versuchen, vertrauliche Anträge und Gesprächsdaten aufzurufen: **muss verweigert werden**.
7. Die bereits vorhandenen Mitgliedskarten und privaten QR-Links prüfen: vor Freigabe ungültig, nach Freigabe gültig, PASSIV korrekt markiert, nach Sperrung nicht mehr gültig.
8. Abzeichen auf eine bestehende Karte vergeben, Link öffnen und Badge anzeigen lassen.
9. Löschanfrage mit Testdaten durchführen; sicherstellen, dass private Anträge und ihre Historie entfernt werden.
10. iPhone: Safari, Startbildschirm-Shortcut, Login, Mobilmenüs, Formulare, Druck der Mitgliedskarte. Optional Browser-Benachrichtigung beim **geöffneten** Owner-Hub ausprobieren.
11. Nach jeder Änderung GitHub Actions → `Frost Skaters checks` und `pages build and deployment` kontrollieren.

## 3. Was vor breiter öffentlicher Nutzung fehlt

- Rechtlich vollständige Angaben zur verantwortlichen erwachsenen Person und fachliche Prüfung der Datenschutzhinweise.
- Angemessener Spam-/Missbrauchsschutz der öffentlich zugänglichen Formulare; aktuell ist kein serverseitiges CAPTCHA/Limitsystem integriert.
- Freigaben für alle veröffentlichten Fotos, besonders von Minderjährigen.
- Verlässliche Bestätigung der FormSubmit-E-Mail-Zustellung; nur die Datenbank ist maßgebend.
- Ein wirklicher Browser-Ende-zu-Ende-Test mit den passenden Testaccounts.
- Echte Push-Nachrichten bei geschlossener iPhone-App sind **nicht** eingerichtet.

**Keine Passwörter oder geheimen Schlüssel auf GitHub speichern. Der ehemalige Kleidungsshop wurde entfernt.**
