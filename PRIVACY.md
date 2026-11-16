# Privacy policy – Barkeys Launcher

**English** · [Deutsch](PRIVACY.de.md)

*Last updated: 2026-11-16*

Barkeys Launcher is a Firefox add-on by TH90DD. This policy explains what the add-on does with data. Short version: **it collects nothing and sends nothing anywhere.**

## What the add-on stores

Only what you enter in its settings:

- extra keywords for your Firefox search engines,
- custom search targets, site keywords and bundles (names, keywords, addresses),
- optional search URLs you enter for export.

This data is saved with Firefox's extension storage (`storage.sync`). If you use Firefox Sync with “Add-ons” enabled, Mozilla syncs it between your devices, end-to-end encrypted, under [Mozilla's privacy notice](https://www.mozilla.org/privacy/firefox/). Without Sync it stays on your device. The developer has no access to it.

A few settings that only matter on one device (e.g. the last opened tab) are kept in local extension storage.

## What the add-on does not do

- No analytics, tracking, telemetry or advertising.
- No network requests of its own. It never contacts the developer or any third party.
- It doesn't read, store or transmit your browsing history or the content of websites.
- In private windows it only runs if you allow it in Firefox – and then works exactly the same way, storing nothing from those windows.

## Permissions and why they are needed

| Permission | Purpose |
|---|---|
| `search` | List your Firefox search engines and run a search with the one a keyword points to. |
| `storage` | Save your settings as described above. |
| `webRequest`, `webRequestBlocking` | Recognise a keyword on your default search engine's result page and redirect before that page loads. |
| Access to one search site (optional, granted by you) | Only the result page of the default search engine you enable, e.g. `www.google.com/search`. Only the search query of that page is read, and only to check for a keyword. |
| `bookmarks` (optional) | Only requested when you use “Pick from bookmarks”. Your bookmarks are searched locally and never stored or transmitted, except the one you choose to add. |

You can revoke optional permissions at any time in `about:addons` → Barkeys Launcher → Permissions.

## Export and import

Exported files are created locally on your computer. Imported files are read locally and validated; nothing is uploaded.

## Searches you make

When a keyword sends you to a website (e.g. a search engine or a site in a bundle), that website receives your request like any normal visit. Its own privacy policy applies.

## Contact

Questions about this policy: please open an issue at <https://github.com/TH90DD/barkeys-launcher/issues>. The responsible party and contact details are listed in the [legal notice of TH90DD](https://th90dd.com/imprint).
