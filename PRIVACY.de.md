# Datenschutzerklärung – Barkeys Launcher

[English](PRIVACY.md) · **Deutsch**

*Stand: 16.11.2026*

Barkeys Launcher ist ein Firefox-Add-on von TH90DD. Diese Erklärung beschreibt, was das Add-on mit Daten macht. Kurz gesagt: **Es sammelt nichts und sendet nichts irgendwohin.**

## Was das Add-on speichert

Nur, was du in den Einstellungen einträgst:

- weitere Kürzel für deine Firefox-Suchmaschinen,
- eigene Suchziele, Seiten-Kürzel und Bündel (Namen, Kürzel, Adressen),
- optional eingetragene Such-URLs für den Export.

Diese Daten liegen im Erweiterungsspeicher von Firefox (`storage.sync`). Nutzt du Firefox Sync mit aktivierten „Add-ons“, synchronisiert Mozilla sie Ende-zu-Ende-verschlüsselt zwischen deinen Geräten – nach dem [Datenschutzhinweis von Mozilla](https://www.mozilla.org/de/privacy/firefox/). Ohne Sync bleiben sie auf deinem Gerät. Der Entwickler hat keinen Zugriff darauf.

Einige Einstellungen, die nur ein Gerät betreffen (z. B. der zuletzt geöffnete Tab oder die gewählte Sprache), liegen im lokalen Erweiterungsspeicher.

## Was das Add-on nicht tut

- Keine Analyse, kein Tracking, keine Telemetrie, keine Werbung.
- Keine eigenen Netzwerkverbindungen. Es kontaktiert weder den Entwickler noch Dritte.
- Es liest, speichert oder überträgt weder deinen Verlauf noch Inhalte von Webseiten.
- In privaten Fenstern läuft es nur, wenn du es in Firefox erlaubst – und arbeitet dort genauso, ohne etwas aus diesen Fenstern zu speichern.

## Rechte und wofür sie nötig sind

| Recht | Zweck |
|---|---|
| `search` | Deine Firefox-Suchmaschinen auflisten und mit der Suchmaschine suchen, auf die ein Kürzel zeigt. |
| `storage` | Deine Einstellungen wie oben beschrieben speichern. |
| `webRequest`, `webRequestBlocking` | Ein Kürzel auf der Ergebnisseite deiner Standardsuche erkennen und umleiten, bevor die Seite lädt. |
| Zugriff auf eine Suchseite (optional, von dir erteilt) | Nur die Ergebnisseite der Standardsuche, die du freigibst, z. B. `www.google.com/search`. Gelesen wird nur die Suchanfrage dieser Seite – und nur, um ein Kürzel zu erkennen. |
| `bookmarks` (optional) | Wird erst angefragt, wenn du „Aus Lesezeichen wählen“ nutzt. Deine Lesezeichen werden lokal durchsucht und weder gespeichert noch übertragen – außer dem einen, das du übernimmst. |

Optionale Rechte kannst du jederzeit unter `about:addons` → Barkeys Launcher → Berechtigungen widerrufen.

## Export und Import

Export-Dateien entstehen lokal auf deinem Rechner. Import-Dateien werden lokal gelesen und geprüft; nichts wird hochgeladen.

## Deine Suchen

Wenn ein Kürzel dich zu einer Webseite führt (z. B. einer Suchmaschine oder einer Seite aus einem Bündel), erhält diese Seite deinen Aufruf wie bei jedem normalen Besuch. Es gilt deren eigene Datenschutzerklärung.

## Kontakt

Fragen zu dieser Erklärung: bitte als Issue unter <https://github.com/TH90DD/barkeys-launcher/issues>. Verantwortlicher und Kontaktdaten stehen im [Impressum von TH90DD](https://th90dd.com/impressum).
