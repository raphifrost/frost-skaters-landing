# Frost Skaters: Mitgliedsanträge, Owner-Freigabe & QR-Karten

**Status vom 13.10.2026:** Das Supabase-Projekt **Frost Skaters** in Frankfurt (`eu-central-1`) wurde angelegt. Die Datenbankmigration wurde erfolgreich ausgeführt und `assets/frost-members-config.js` enthält bereits die öffentliche Projekt-URL und den sicheren **publishable** API-Key. **Wichtig: Es existiert noch kein Admin-Account**; bis zu dessen Freischaltung kann niemand eingehende Anträge im Dashboard annehmen.

Dieses System besteht aus drei Bereichen:

- **Mitgliederseite:** `mitglieder.html` – Besucher können einen Spitznamen eingeben und einen Antrag schicken. Es wird ein zufälliger, privater Karten-Code erzeugt. Dieser ist automatisch auf dem anfragenden Gerät gespeichert, sofern lokale Speicherung erlaubt ist; den angezeigten Link sollte man zusätzlich sichern.
- **Owner-Dashboard:** `mitglieder-admin.html` – Nur ein freigeschalteter Supabase-Auth-Account kann alle Anträge sehen, Mitglieder annehmen, ablehnen, sperren, selbst neu eintragen und aktive Kartenlinks kopieren.
- **Bestätigte Karte:** Auf `mitglieder.html?code=…` erscheinen Name/Spitzname, Rolle, Mitgliedsnummer, Status und ein QR-Code mit demselben Karten-Link. Vor der Freigabe und nach Sperrung erscheint **keine** gültige Karte.

Die GitHub Pages Website hostet nur HTML, CSS und JavaScript, nicht die Datenbank und nicht den Auth-Server. Die Supabase-Verbindung wurde eingerichtet. **Für Freigaben fehlt noch der Owner-Account** (siehe Schritt 2). Das Formular sollte Anträge an die Datenbank senden können; ein vollständiger Browser-End-to-End-Test steht noch aus.

## Schritt 1: Supabase-Projekt und Datenbank – ERLEDIGT

Das Projekt wurde bereits angelegt, der SQL-Code wurde erfolgreich ausgeführt. Bitte **nicht ein zweites Projekt** erstellen.

Damit entstehen die private Antragstabelle, die Admin-Liste und eine Funktion, die nur bereits genehmigte Karten über ihren schwer erratbaren Code abruft.

## Schritt 2: Owner-Account einrichten

1. Unter **Authentication → Users** einen Benutzer für den Owner anlegen (E-Mail + starkes eigenes Passwort).
2. Kopiere dessen **User UUID**.
3. Im **SQL Editor** folgenden Befehl ausführen und die UUID durch deine eigene ersetzen:

```sql
insert into public.frost_admins(user_id)
values ('DEINE-ECHTE-USER-UUID') on conflict do nothing;
```

Das Passwort niemals in GitHub, in Chats oder in Formularfeldern außerhalb des echten Owner-Logins teilen.

**Wichtig:** Falls offene Registrierung unter Authentication möglich ist, sind neue Supabase-Benutzer dadurch **nicht** automatisch Owner. Die Datenbankrechte gelten ausschließlich für ausdrücklich in `frost_admins` eingetragene Accounts.

## Schritt 3: Website mit dem Projekt verbinden – ERLEDIGT

Unter **Project Settings → API Keys** (je nach Supabase-Oberfläche auch **Connect / API Keys**) findest du den öffentlichen `anon`- oder `publishable`-Key. Die Projekt-URL liegt unter **Project Settings → API**.

Die Datei `assets/frost-members-config.js` ist bereits korrekt mit dem **publishable Key** verbunden. Dies ist nur ein Beispiel, falls du sie später erneut konfigurieren musst:

```js
window.FROST_MEMBERS_CONFIG = {
  supabaseUrl: "https://DEIN-PROJEKT.supabase.co",
  supabaseAnonKey: "DEIN-OEFFENTLICHER-PUBLISHABLE-ODER-ANON-KEY"
};
```

**Niemals einen `service_role`-Key, `secret`-Key oder das Owner-Passwort in JavaScript / GitHub speichern.** Der öffentliche Key ist nur dank Row-Level Security (RLS) sicher; daher die SQL-Richtlinien unbedingt vollständig einrichten.

## Schritt 4: Testen

1. Öffne die Live-Website unter `https://raphifrost.github.io/frost-skaters-landing/mitglieder.html`.
2. Stelle einen Testantrag mit einem ausgedachten Spitznamen und sichere den privaten Karten-Link.
3. Der Link zeigt vor der Annahme keine gültige Karte.
4. Öffne `https://raphifrost.github.io/frost-skaters-landing/mitglieder-admin.html` und melde dich mit dem Owner-Account an.
5. Der offene Antrag erscheint im Dashboard. Klicke auf **Annehmen**.
6. Öffne den privaten Karten-Link erneut. Er zeigt jetzt eine gültige Karte mit lokal erzeugtem QR-Code.
7. Teste auch **Sperren**. Danach darf die Karte nicht mehr als aktiv angezeigt werden.
8. Teste **Mitglied direkt eintragen** und kopiere dessen Karten-Link.

## Datenschutz und Sicherheit

- Verwende am besten **Spitznamen**. Bewahre keine Telefonnummern, Adressen, vollständigen Geburtsdaten oder sensible Infos in diesem System auf.
- Offene Anträge sind durch RLS nur für berechtigte Admin-Accounts lesbar. Der zufällig generierte Kartencode ist wie ein privater Link: Wer ihn erhält, kann den freigegebenen Spitznamen und die Rolle sehen.
- Mitglieder müssen ihren Karten-Link privat aufbewahren. Keine offenen Kartenlisten auf der Website.
- Das Admin-Login speichert die Sitzung bewusst nicht dauerhaft. Nach einem Neuladen ist eine erneute Anmeldung notwendig.
- Das System benötigt bei öffentlicher Nutzung zusätzliche Maßnahmen gegen Spam, etwa eine geeignete CAPTCHA- oder Rate-Limit-Lösung. Sonst könnten fremde Personen viele sinnlose Anträge absenden.
- Wenn du Anträge von Minderjährigen sammelst, erkläre datensparsam und verständlich, wie Daten verwendet werden, und hol bei Bedarf Unterstützung durch eine volljährige Vertrauensperson.
- Bildkarten oder QR-Codes sind **keine amtlichen Ausweise**. Sie zeigen nur den Community-Status.

## Häufige Fehler

- **System wird eingerichtet:** `frost-members-config.js` enthält noch Platzhalter oder eines der externen JavaScript-Module konnte nicht geladen werden.
- **Antrag kann nicht gesendet werden:** Projekt-URL und öffentlichen Key kontrollieren; SQL-Richtlinien prüfen; Browser-Konsole auf Fehlermeldungen ansehen.
- **Login geht, aber kein Dashboard:** Die User-UUID fehlt in `frost_admins`.
- **Karte bleibt ungültig:** Im Dashboard Status prüfen. Nur `approved` wird öffentlich angezeigt.
- **QR-Code fehlt:** Externes QRCode-Skript ist nicht geladen. Der Karten-Link kann weiterhin benutzt werden.

Dateien: `mitglieder.html`, `mitglieder-admin.html`, `assets/frost-members.css`, `assets/frost-members.js`, `assets/frost-members-admin.js`, `assets/frost-members-config.js`, `supabase/frost-members.sql`.
