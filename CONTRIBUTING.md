# Contributing to Barkeys Launcher

Thanks for helping! *Deutsch: Beiträge sind auch auf Deutsch willkommen – Issues und Pull Requests gern in beiden Sprachen.*

## Ways to help

- **Report a bug or suggest an idea:** open an [issue](https://github.com/TH90DD/barkeys-launcher/issues). Include your Firefox version, what you typed and what happened.
- **Translate:** see [Languages & translations](README.md#languages--translations).
- **Code:** fork the repo, create a branch, open a pull request.

## Before you open a pull request

```bash
node --test 'tests/*.test.mjs'   # all tests must pass
npx web-ext lint     # 0 errors, 0 warnings
```

Then load the add-on via `about:debugging` and try your change in Firefox.

## Ground rules

Barkeys Launcher promises its users a few things. Pull requests must keep them:

- **No data collection, no analytics, no network requests of its own.**
- **Minimal permissions.** New features that need a permission request it as *optional*, only when the user turns the feature on.
- **Validate everything** that comes from storage, Sync or import files (see `lib/validate.js`). Redirects only to `http(s)`.
- **No `innerHTML`** – build the UI with the `h()` helper / `textContent`.
- **Texts in `_locales/`**, never hard-coded; add new keys to every language (English is fine as a placeholder in others).
- Keep the style: small files, plain JavaScript, no build step, no external dependencies at runtime.

## Credits

Add yourself to `lib/credits.js` in your pull request (`contributors`, or `translators` for a language) – you'll show up in the Credits dialog.

## License

By contributing you agree that your contribution is licensed under the [Mozilla Public License 2.0](LICENSE), like the rest of the project.
