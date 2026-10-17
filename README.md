# Koaabooks

Koaabooks is an expense tracker that installs on a computer or phone as a web
app (PWA). Enter expenses and income in a spreadsheet-like table, sort them
into categories, and see monthly and tax summaries for each tax year. Bank
statements can be imported from CSV, with saved column mappings per bank.

Everything is stored in the browser (localStorage). There is no server and no
account: use **Download** / **Import** in the header to back up your books or
move them to another device.

Koaabooks used to be the Expense Tracker in Okaasan. **Import** also accepts
the files Okaasan saved (`uploads/data/expense-tracker/2025.json`,
`_categories.json`, ...): select them all at once.

## Develop

```sh
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve dist/ locally
npm run icons      # redraw the app icons into public/
```

| Path | What it holds |
|---|---|
| `src/App.tsx` | The page around the tracker: header, tabs, backup |
| `src/ExpenseTracker.tsx` | The tracker: entries, summaries, categories, CSV import |
| `src/store.ts` | Browser storage, backup and import |
| `vite.config.ts` | Build, app manifest and offline cache |
| `public/_headers` | Cache rules on Cloudflare |
| `wrangler.jsonc` | Cloudflare deploy: serve `dist/` as static files |

## Tabs

| Tab | What it shows |
|---|---|
| Entries | Every entry of the tax year. Click a cell to edit; Tab / Enter move between cells |
| Summary | Income and expenses per category, month by month, and the net |
| Tax Summary | The same, for the categories marked tax deductible |
| Types | The categories: icon, name, tax deductible, notes |
| From / Bank / Details | Values offered as suggestions when typing in those columns |

## Deploy on Cloudflare

Workers & Pages → Create → import this repository, then:

| Setting | Value |
|---|---|
| Project name | `koaabooks` (must match `name` in `wrangler.jsonc`) |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Environment variable | `NODE_VERSION` = `20` |

Every push to `main` deploys. Check a build locally with
`npm run build && npx wrangler deploy --dry-run`.

To serve the app under a sub-path instead (e.g. GitHub Pages at `/koaabooks/`),
build with `BASE_PATH=/koaabooks/ npm run build`.

## Install

- **Chrome / Edge (Windows, macOS, Linux):** click the install icon at the right
  end of the address bar, or use the **Install app** button in the header.
- **Safari on macOS:** File → **Add to Dock**.
- **iPhone / iPad:** open in Safari → Share → **Add to Home Screen**.

Open it once while online so it is saved for offline use. The installed app has
its own storage: move existing data into it with Download / Import.
