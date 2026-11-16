# addons.mozilla.org listing – texts

Copy these into the Developer Hub (*Edit Product Page*) when the add-on gets listed publicly.
The description field supports *some* Markdown: bold, italics, links, lists and inline code – no `#` headings, so section titles are bold lines. Copy the text **without** the leading `> `.
Switch the language with **“Localize for”** (top right) to enter the German version.

---

## English (US)

**Name:** Barkeys Launcher

**Add-on URL (slug):** `barkeys-launcher`

**Summary** (max. 250 characters):

> Type less, land faster. Give every search engine as many address bar keywords as you like – @y, @yt and @youtube all go to YouTube – plus site shortcuts and bundles that open your whole workspace with one word.

**Description:**

> **Firefox gives every search engine exactly one keyword. Barkeys Launcher gives it as many as you want.**
>
> Type `@yt cats`, `@wiki Berlin` or `@amazon.com headphones` straight into the address bar – no detours, no extra clicks.
>
> **What you get**
> - **More keywords per search engine** – `@w`, `@wiki` and `@wikipedia` all search Wikipedia.
> - **Custom targets** – turn any site with a search into a keyword, just with its URL.
> - **Site keywords** – `@news` opens your news site directly. Pick them from your bookmarks if you like.
> - **Bundles** – `@workspace` opens mail, calendar and project tool in one go.
> - **45+ ready-made presets** – Wikipedia, DeepL, Amazon, GitHub, Flathub and more, with country and language variants.
> - **Sync, backup & sharing** – keywords travel with Firefox Sync; export/import as a file.
> - **German and English**, follows your Firefox language.
>
> **Private by design**
> No data collection, no analytics, no network requests of its own. Barkeys Launcher only looks at your default search engine's result page – and only to spot a keyword. Optional permissions are asked for only when you use the feature.
>
> **Good to know**
> Firefox only shows the engine's name label for its own main keyword. Barkeys Launcher steps in after you press Enter – so use your favourite keyword as the main one in Firefox and let Barkeys Launcher be the safety net for all the others.
>
> Barkeys Launcher is a side project, open source under [MPL-2.0](https://github.com/TH90DD/barkeys-launcher/blob/main/LICENSE). Bug reports and ideas are welcome on [GitHub](https://github.com/TH90DD/barkeys-launcher/issues).

**Tags / categories:** Search Tools, Productivity (pick what the Developer Hub offers)

**Contributions URL:** `https://buymeacoffee.com/th90dd`

**Homepage:** `https://github.com/TH90DD/barkeys-launcher`

**Support site:** `https://github.com/TH90DD/barkeys-launcher/issues`

**Privacy policy:** paste the content of `PRIVACY.md`

**Screenshots:** welcome tab, search engines tab, presets tab, a bundle (1280×800)

---

## Deutsch

**Summary** (max. 250 Zeichen):

> Weniger tippen, schneller ankommen. Gib jeder Suchmaschine beliebig viele Kürzel – @y, @yt und @youtube führen alle zu YouTube – dazu Seiten-Kürzel und Bündel, die deinen ganzen Workspace mit einem Wort öffnen.

**Beschreibung:**

> **Firefox gibt jeder Suchmaschine genau ein Kürzel. Barkeys Launcher gibt ihr so viele, wie du willst.**
>
> Tippe `@yt katzen`, `@wiki Berlin` oder `@amazon.com kopfhörer` direkt in die Adressleiste – ohne Umweg, ohne Extra-Klicks.
>
> **Was du bekommst**
> - **Mehr Kürzel pro Suchmaschine** – `@w`, `@wiki` und `@wikipedia` durchsuchen alle Wikipedia.
> - **Eigene Ziele** – jede Seite mit Suchfunktion wird per URL zum Kürzel.
> - **Seiten-Kürzel** – `@news` öffnet direkt deine Nachrichtenseite, auf Wunsch aus deinen Lesezeichen gewählt.
> - **Bündel** – `@workspace` öffnet Mail, Kalender und Projekt-Tool auf einmal.
> - **45+ fertige Vorlagen** – Wikipedia, DeepL, Amazon, GitHub, Flathub und mehr, mit Länder- und Sprachvarianten.
> - **Sync, Backup & Teilen** – Kürzel reisen per Firefox Sync mit; Export/Import als Datei.
> - **Deutsch und Englisch**, passend zur Sprache deines Firefox.
>
> **Datenschutz eingebaut**
> Keine Datensammlung, keine Statistik, keine eigenen Netzwerkverbindungen. Barkeys Launcher schaut nur auf die Ergebnisseite deiner Standardsuche – und nur, um ein Kürzel zu erkennen. Optionale Rechte werden erst abgefragt, wenn du die Funktion nutzt.
>
> **Gut zu wissen**
> Den Namen der Suchmaschine zeigt Firefox nur beim eigenen Haupt-Kürzel an. Barkeys Launcher greift nach Enter ein – nimm also dein Lieblingskürzel als Haupt-Kürzel in Firefox, und Barkeys Launcher ist das Sicherheitsnetz für alle anderen.
>
> Barkeys Launcher ist ein Nebenprojekt, Open Source unter [MPL-2.0](https://github.com/TH90DD/barkeys-launcher/blob/main/LICENSE). Fehlerberichte und Ideen sind auf [GitHub](https://github.com/TH90DD/barkeys-launcher/issues) willkommen.

**Datenschutzrichtlinie:** Inhalt von `PRIVACY.de.md` einfügen

---

## Technical Details → Whiteboard (notes for reviewers, not public)

```
Barkeys Launcher adds extra address bar keywords for Firefox search engines.

Why the permissions:
- webRequest/webRequestBlocking + optional host permission for ONE search result page (e.g. www.google.com/search): when Firefox sends an unknown keyword like "@yt cats" to the default engine, the add-on reads only the query parameter of that main_frame request and redirects (or hands the search to the Firefox engine via search.search). No other requests are inspected.
- search: list Firefox search engines and run searches with them.
- storage: user settings in storage.sync.
- bookmarks (optional): only for "Pick from bookmarks", searched locally.

No remote code, no minification, no build step, no data collection, no network requests of its own.
Source and tests: https://github.com/TH90DD/barkeys-launcher (node --test tests/)
```

Additional Details: Default locale English (US); tags from Mozilla's fixed list (e.g. search, productivity); UUID never changes.
