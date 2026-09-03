# RG API server

Express server backing the RG General Contracts site. It stores the portfolio
projects and the editable page content, and can also host the built frontend.

## Running

```bash
npm install          # once
npm run dev          # http://localhost:4000, restarts on file changes
npm start            # production
```

From the project root, `npm run dev` starts this server *and* the Vite dev
server together, with Vite proxying `/api` here.

Data lives in `server/data/db.json`, seeded from `src/defaults.js` on first
run. Images and videos uploaded from `/admin` sit next to it in
`server/data/uploads/`. Both are gitignored — back them up like any other
database.

## Configuration

All optional; see `.env.example`. Load a file with
`node --env-file=.env src/index.js`, or set them in your host's environment.

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `4000` | Port to listen on |
| `ADMIN_TOKEN` | *(unset)* | Secret required by write endpoints. **Set this in production.** |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed origin(s), comma-separated, or `*` |
| `DATA_DIR` | `./data` | Where `db.json` and `uploads/` are written |
| `MAX_UPLOAD_MB` | `200` | Largest file `/api/media` accepts |
| `CLIENT_DIST` | `../dist` | Built frontend to serve, when it exists |
| `SITE_URL` | *(request host)* | Canonical origin for SEO tags, e.g. `https://rggeneralcontracts.com` |

## Endpoints

Reads are public. Writes require `Authorization: Bearer <ADMIN_TOKEN>` when
`ADMIN_TOKEN` is set — the admin page sends it from the key entered at login.

When `ADMIN_TOKEN` is set, `/admin` opens on a login screen and stays locked
until the key passes `/api/auth/verify`; the key is then kept in the browser's
local storage until "خروج". With `ADMIN_TOKEN` unset there is nothing to check,
so the login screen is skipped entirely and local development is unaffected.
Note the gate is a convenience, not the security boundary — the API's token
check is what actually protects the content.

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/api/health` | Liveness check |
| `GET` | `/api/auth` | `{ required }` — whether `ADMIN_TOKEN` is set |
| `POST` | `/api/auth/verify` | Checks a key without writing. `204` or `401` |
| `GET` | `/api/projects` | All portfolio projects |
| `POST` | `/api/projects` | Create; server assigns the `id`. Returns 201 |
| `PUT` | `/api/projects/:id` | Replace a project |
| `DELETE` | `/api/projects/:id` | Returns 204 |
| `GET` | `/api/settings` | Editable page content |
| `PUT` | `/api/settings` | Partial update — omitted fields keep their value |
| `GET` | `/api/media` | Uploaded files, newest first. Admin only |
| `POST` | `/api/media` | Upload one image or video (`multipart/form-data`, field `file`). Returns 201 with its URL |
| `GET` | `/api/media/:name` | Serves an uploaded file. Public, supports range requests |
| `DELETE` | `/api/media/:name` | Returns 204 |
| `POST` | `/api/reset` | Restore seed content |
| `GET` | `/robots.txt` | Generated; points at the sitemap |
| `GET` | `/sitemap.xml` | Home page plus one URL per project |

Bad payloads return `400` with `{ "error": "..." }`; unknown ids return `404`.
Request bodies are validated and unknown fields are dropped, so only the
documented shape is ever stored.

## SEO

The site is a single-page app, so a page only exists once JavaScript has run.
Search crawlers mostly cope with that; the scrapers behind WhatsApp, Facebook,
and X do not run any. So this server renders the `<head>` per URL before it
sends `index.html` — title, description, canonical, Open Graph, Twitter card,
and JSON-LD (`GeneralContractor` and `WebSite` on the home page, plus
`CreativeWork` and `BreadcrumbList` on a project). See `src/seo.js`.

Two consequences worth knowing:

- **Set `SITE_URL` in production.** Without it the canonical and Open Graph
  URLs are built from the request's own host, so the same page can advertise
  different URLs depending on how it was reached.
- **This only happens when this server serves the site.** Running
  `npm run dev`, Vite serves `index.html` itself and none of it applies —
  build and `npm start` to check the tags.

A request for a project that doesn't exist answers `404` with the app still
rendering its "not found" screen, so a dead link is never a soft 200. The
admin page is served `noindex, nofollow`.

## Deploying

Build the frontend, then run this server — it serves `dist/` and the API from
one process, so there is nothing else to host:

```bash
npm run build                      # in the project root
ADMIN_TOKEN=$(node -e "console.log(crypto.randomUUID())") \
  npm start                        # serves site + API on :4000
```

Put a reverse proxy (nginx, Caddy) in front for TLS. Two things to know:

- **Set `ADMIN_TOKEN`.** Without it, anyone who finds `/admin` can edit the
  site. The server prints a warning at startup when it is unset.
- **`DATA_DIR` is the whole database.** It holds `db.json` *and* every
  uploaded image and video. Persist and back it up; on ephemeral hosts
  (containers, some PaaS) mount a volume or the content resets to defaults
  and the uploads disappear on every deploy.
