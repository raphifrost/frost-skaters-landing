# Mein Space · mit Leon

Statische Startseite für PC und Handy. Öffentlicher Einstieg: `https://raphifrost.github.io/frost-skaters-landing/desktop/`.

Lokal vom Repository aus starten: `python3 -m http.server 8000 --bind 127.0.0.1`; App unter `/desktop/` öffnen. Es gibt keine zu installierenden Pakete.

Nach Änderungen an HTML, CSS oder JavaScript `python3 desktop/build.py` ausführen. Das erstellt die eigenständige PC-Datei und das ZIP neu. `Mein-Space.html` kann ohne Webserver geöffnet werden; die PWA-Funktionen benötigen die HTTPS-Webseite.

Notizen, importierte ChatGPT-Exporte, Aufgaben und Verknüpfungen werden im Browser über IndexedDB gespeichert; localStorage dient als Rückfall. PC und Handy synchronisieren nicht automatisch. Backups übertragen die Daten. Persönliche Gesprächsinhalte gehören ausschließlich in diesen lokalen Speicher oder eigene Backup-Dateien, nicht in veröffentlichte Quelldateien.

ChatGPT ist eine externe Verknüpfung. Die Website enthält keinen KI-Server und benötigt keinen API-Schlüssel. Steam/Epic müssen für native PC-Spielstarts installiert sein. Auf dem Handy werden passende Webziele verwendet.

`sw.js` enthält den lokalen Offline-Cache. Bei Änderungen an ausgelieferten App-Dateien die Cache-Version mit erhöhen.
