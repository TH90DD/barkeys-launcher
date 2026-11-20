<p align="center"><img src="docs/banner.png" alt="Barkeys Launcher – more keywords for your Firefox address bar" width="100%"></p>

# Barkeys Launcher

<p align="center">
  <img alt="Version" src="https://img.shields.io/github/manifest-json/v/TH90DD/barkeys-launcher?label=version&color=d60042">
  <img alt="Firefox 142+" src="https://img.shields.io/badge/Firefox-142%2B-ff7139?logo=firefoxbrowser&logoColor=white">
  <img alt="License MPL-2.0" src="https://img.shields.io/github/license/TH90DD/barkeys-launcher?color=181721">
  <img alt="Data collection: none" src="https://img.shields.io/badge/data%20collection-none-2ea44f">
  <img alt="Languages EN | DE" src="https://img.shields.io/badge/languages-EN%20%7C%20DE-6b6a76">
</p>

<p align="center"><b>English</b> · <a href="README.de.md">Deutsch</a></p>

**More keywords for your Firefox address bar.**

Firefox gives each search engine exactly **one** keyword. Barkeys Launcher turns the address bar into a launcher: as many keywords per search engine as you like, any site with a search as its own keyword, shortcuts to your favourite pages and bundles that open several tabs at once – all typed straight into the address bar.

**Features at a glance**

- **More keywords per search engine** – `@w`, `@wiki` and `@wikipedia` all search Wikipedia.
- **Custom targets** – any site with a search becomes a keyword via its URL, e.g. `@dict word`.
- **Site keywords** – `@news` opens your news site directly; pick them from your bookmarks if you like.
- **Bundles** – `@workspace` opens mail, calendar and project tool in one go.
- **45+ presets** – Wikipedia, DeepL, Amazon, GitHub, Flathub and more, with country and language variants.
- **Sync, backup & sharing** – keywords travel with Firefox Sync; export/import as a file.
- **Private by design** – no data collection, no network requests of its own, optional permissions only when you use a feature.
- **English & German** – follows your Firefox language, or pick one.

It **extends** your Firefox search engines, it doesn't replace them.

> **A side project.** I built Barkeys Launcher for my own needs and share it because others might find it useful. Updates and new features happen at my own discretion, without a fixed schedule or guaranteed support, and it may contain bugs. It's provided *as is*, without warranty – see the [MPL-2.0](LICENSE). Bug reports and ideas are welcome via [issues](https://github.com/TH90DD/barkeys-launcher/issues).

## Installation

Barkeys Launcher is distributed **only via [addons.mozilla.org](https://addons.mozilla.org/)** – the official Firefox add-on store, with automatic updates and Mozilla's review.

> **Coming soon.** The store page is being prepared; the link will appear here once it's live.

Please don't install builds from other sources. Developers can load the code temporarily for testing – see [Development](#development).

## How it works

| Search engine | Main keyword (set in Firefox) | Extra keywords (set in Barkeys Launcher) |
|---|---|---|
| YouTube | `@y` | `@yt`, `@youtube` |
| Wikipedia | `@w` | `@wiki`, `@wikipedia` |

1. You type `@wiki cats` into the address bar.
2. Firefox doesn't know `@wiki`, so it sends the text to your default search engine.
3. Barkeys Launcher catches that result page before it loads and hands the search to your Firefox engine "Wikipedia" instead.

### Screenshots

<table>
  <tr>
    <td align="center" width="50%"><b>Extra keywords for your search engines</b><br><br><img src="docs/screenshots/search-engines.png" alt="Search engines tab"></td>
    <td align="center" width="50%"><b>Bundles: one keyword, several tabs</b><br><br><img src="docs/screenshots/bundles.png" alt="Bundles"></td>
  </tr>
  <tr>
    <td align="center" width="50%"><b>45+ presets with country &amp; language variants</b><br><br><img src="docs/screenshots/presets.png" alt="Presets tab"></td>
    <td align="center" width="50%"><b>Welcome tab with setup checklist</b><br><br><img src="docs/screenshots/welcome.png" alt="Welcome tab"></td>
  </tr>
</table>

### Good to know

- **Name label only for the main keyword.** While typing `@w `, Firefox shows "Wikipedia ×". For extra keywords it shows "Search with Google". Barkeys Launcher only steps in after you press Enter, because add-ons can't change the address bar. Tip: use the keyword you type most as the main keyword in Firefox, and let Barkeys Launcher be the safety net for the rest.
- **Settings:** click the BK button in the toolbar (or pin it from the extensions menu).
- **Add-ons can't create Firefox search engines.** You add the engine once in Firefox Settings → Search; Barkeys Launcher picks it up automatically.

## Permissions & privacy

| Permission | Why |
|---|---|
| `search` | List your Firefox search engines and run searches with them |
| `storage` | Save your keywords (synced via Firefox Sync if enabled) |
| `webRequest`, `webRequestBlocking` | Catch the default engine's result page and redirect it |
| `bookmarks` (optional) | Only when you use “Pick from bookmarks” for site keywords; searched locally |
| Access to *one* search site (optional) | Only the result page of the default engine you enable in the settings, e.g. `www.google.com/search` |

No data collection, no analytics, no network requests of its own. Full details: [PRIVACY.md](PRIVACY.md).

**Security notes**

- Everything read from storage, Sync or an import file is validated: keywords (length, no spaces), names, and search URLs (`http(s)` only, must contain `%s`). Invalid entries are dropped, never executed.
- Redirects only ever go to `http(s)` URLs; search terms are URL-encoded.
- The options page builds its UI with `textContent` only – no `innerHTML`.
- Search engine icons are only shown if they're embedded (`data:` etc.), so opening the settings never contacts a website.
- Data is stored as one small item per entry, well within Firefox Sync's limits (8 KB per item, 100 KB total).

## Sync, backup & sharing

Keywords are stored in `storage.sync`, so they follow you via Firefox Sync (with “Add-ons” enabled). Firefox doesn't sync custom search engines itself; Barkeys Launcher lists keywords of missing engines under *Not found in Firefox*. Export/import (JSON) works without Sync and can carry the engines' search URLs to set them up on a new device.

## Development

```bash
node --test 'tests/*.test.mjs'   # unit tests for storage, import validation and redirects
npx web-ext lint
npx web-ext run      # starts a test Firefox with the add-on
npx web-ext build    # zip in web-ext-artifacts/
tools/sign.sh        # sign via addons.mozilla.org (asks for API credentials, hidden)
```

```
lib/        shared core: constants, validation, storage (sync schema v2), keyword resolver
background.js   intercepts the default engine's result page and redirects
options/    settings UI: one file per tab (welcome, engines, custom, sites, presets, data) + guide in HTML
_locales/   UI translations (de, en)
tests/      node:test unit tests (not shipped in the add-on)
```

Or load it temporarily: `about:debugging#/runtime/this-firefox` → "Load Temporary Add-on…" → `manifest.json`.

## Contributing

Issues and pull requests are welcome – see [CONTRIBUTING.md](CONTRIBUTING.md).

## Languages & translations

The settings follow Firefox's language automatically; under *Data & sync → Language* you can pick a fixed one. Currently: **English** and **German**.

Want to add a language? Copy `_locales/en/messages.json` to `_locales/<code>/messages.json` (e.g. `fr`), translate the `message` values (keep `$placeholders$` and `%s` as they are), add the language to `BK.LOCALES` in `lib/constants.js` and open a pull request.

## Roadmap

- Live suggestions in the address bar via a dedicated keyword
- Smarter bookmark search
- Bundle from a bookmark folder

## Support

If Barkeys Launcher saves you some keystrokes, you can [buy me a coffee ☕](https://buymeacoffee.com/th90dd).

## Legal

Published by TH90DD · [Legal notice](https://th90dd.com/imprint) · [Privacy policy](PRIVACY.md)

## License

[MPL-2.0](LICENSE) © TH90DD · Interface icons by [Lucide](https://lucide.dev) (ISC), see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
