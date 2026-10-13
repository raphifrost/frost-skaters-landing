# frost-skaters-landing
Frost Skaters - Landingpage mit QR-Code, WhatsApp und Kontakt


Die persönliche PC-/Handy-Startseite liegt unter [`desktop/`](desktop/README.md).

Das Anmeldeformular der Landingpage verwendet FormSubmit. Vor dem ersten verlässlichen E-Mail-Empfang muss die Empfängeradresse über FormSubmits Bestätigungsmail aktiviert werden. Browser-Tests können Formular-POSTs abfangen; sie prüfen dabei keine echte E-Mail-Zustellung.

Der Shop unter `shop.html` bietet die Personalisierung eines selbst mitgebrachten Hoodies für 25 €: großes Rückenlogo und Name auf dem linken Arm. Anfragen werden vom Besucher über WhatsApp versendet; die Website verarbeitet keine Zahlung. Die gemeinsame Navigation liegt in `assets/site-menu.css` und `assets/site-menu.js`.

`leitung.html` stellt die drei Leitungsrollen öffentlich vor. `organisation.html` öffnet den internen Plan mit einem gemeinsamen Leitungspasswort. Alle Planinhalte liegen ausschließlich verschlüsselt in `assets/organisation.enc.json` (AES-GCM-256 mit PBKDF2-SHA-256). Passwort und Klartext dürfen niemals in diesem Repository, in URLs oder in öffentlichen Downloads stehen.

Dies sind keine individuellen Benutzerkonten: Wer das gemeinsame Passwort kennt, kann den Plan entschlüsseln. Nur an Owner, Co-Owner/in und Managerin weitergeben. Einzelne Personen können damit nicht getrennt freigeschaltet oder gesperrt werden. Für solche Rollenrechte ist ein zusätzlicher Authentifizierungsdienst erforderlich.

Zum Aktualisieren den privaten Plan und das Zufallspasswort außerhalb des Checkouts aufbewahren und neu verschlüsseln:

```sh
node tools/encrypt-organisation.mjs \
  --plan /PRIVATE_DIRECTORY/organisation-plan.json \
  --password-file /PRIVATE_DIRECTORY/leitung-passwort.txt \
  --minimum-password-length 7 \
  --output assets/organisation.enc.json
```

Der Nutzer hat ausdrücklich ein Passwort mit sieben zufälligen Zeichen gewünscht. Dafür ist die oben gezeigte Ausnahme nötig; ohne diese Option verlangt das Tool weiterhin mindestens 32 Zeichen. Ein längeres Zufallspasswort bietet mehr Schutz gegen das Erraten des herunterladbaren verschlüsselten Plans.

Das private JSON hat `title`, `intro` und sechs `sections` mit jeweils `tag`, `title`, `description` und `nextStep`. Das Tool erzeugt bei jedem Aufruf einen neuen Salt und eine neue IV. Veröffentlicht wird nur die verschlüsselte Ausgabe. Beim Passwortwechsel ebenfalls neu verschlüsseln und die Versionsquery des Skripts in `organisation.html` sowie der JSON-Anfrage in `assets/organisation.js` erhöhen, damit alte Cache-Einträge umgangen werden. Früher heruntergeladene Fassungen lassen sich nicht nachträglich zurückholen.

Der entschlüsselte Plan bleibt nur in diesem Browser-Tab. Abmelden, Neuladen und Zurück-/Vorwärtsnavigation sperren ihn erneut. Es wird kein Passwort, Plan oder Loginzustand in Webspeichern abgelegt; der Service Worker unter `desktop/` betrifft diesen Bereich nicht. Zugriff erfordert HTTPS und WebCrypto. Lokale Tests funktionieren über `http://127.0.0.1`.
