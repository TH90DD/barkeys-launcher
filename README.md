# Barkeys Launcher

**Smarter search with address bar keywords.**

Firefox lets you give each search engine exactly **one** keyword. Barkeys Launcher adds as many extra keywords as you like – `@w`, `@wiki` and `@wikipedia` all search Wikipedia.

It **extends** your Firefox search engines, it doesn't replace them.

## How it works

| Search engine | Main keyword (set in Firefox) | Extra keywords (set in Barkeys) |
|---|---|---|
| YouTube | `@y` | `@yt`, `@youtube` |
| Wikipedia | `@w` | `@wiki`, `@wikipedia` |

1. You type `@wiki cats` into the address bar.
2. Firefox doesn't know `@wiki`, so it sends the text to your default search engine.
3. Barkeys catches that result page before it loads and hands the search to your Firefox engine "Wikipedia" instead.

You can also add targets that have no Firefox search engine at all, just a URL with `%s`.

### Good to know

- **Name label only for the main keyword.** While typing `@w `, Firefox shows "Wikipedia ×". For extra keywords it shows "Search with Google". Barkeys only steps in after you press Enter, because add-ons can't change the address bar. Tip: use the keyword you type most as the main keyword in Firefox, and let Barkeys be the safety net for the rest.
- **Add-ons can't create Firefox search engines.** You add the engine once in Firefox Settings → Search; Barkeys picks it up automatically.

## Permissions & privacy

| Permission | Why |
|---|---|
| `search` | List your Firefox search engines and run searches with them |
| `storage` | Save your keywords (synced via Firefox Sync if enabled) |
| `webRequest`, `webRequestBlocking` | Catch the default engine's result page and redirect it |
| Access to *one* search site (optional) | Only the result page of the default engine you enable in the settings, e.g. `www.google.com/search` |

No data collection, no analytics, no network requests of its own.

## Development

```bash
npx web-ext lint
npx web-ext run      # starts a test Firefox with the add-on
npx web-ext build    # zip in web-ext-artifacts/
```

Or load it temporarily: `about:debugging#/runtime/this-firefox` → "Load Temporary Add-on…" → `manifest.json`.

## Roadmap

- Site keywords (`@news` → your favourite news site)
- Live suggestions in the address bar via a dedicated keyword
- Smarter bookmark search

## Support

If Barkeys saves you some keystrokes, you can [buy me a coffee ☕](https://buymeacoffee.com/th90dd).

## License

[MPL-2.0](LICENSE) © TH90DD
