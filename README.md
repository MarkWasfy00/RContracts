# RG General Contracts

Portfolio site for RG General Contracts (مقاولات عامة وتشطيبات وديكورات),
with an admin panel for managing the portfolio and page content.

- `/` — the public site (Arabic, RTL)
- `/projects/<id>` — each project on its own page, with per-page SEO tags
- `/admin` — content management: add/edit/delete projects, upload images and
  videos, edit page copy
- `server/` — Express API that stores it all ([details](./server/README.md))

# Getting Started

```bash
npm run install:all   # installs both the frontend and server deps
npm run dev           # starts the site on :3000 and the API on :4000
```

`npm run dev` runs both processes together. To run just one, use
`npm run dev:web` or `npm run dev:api`.

# Building For Production

```bash
npm run build   # builds the frontend into dist/
npm start       # serves dist/ AND the API from the Express server on :4000
```

Set `ADMIN_TOKEN` before exposing this publicly — otherwise anyone who finds
`/admin` can edit the site. Set `SITE_URL` to the live domain too, so
canonical links and shared-link previews point at one address. See
[server/README.md](./server/README.md).

The Express server renders each page's `<head>` — title, description,
Open Graph, JSON-LD — before sending `index.html`, which is what makes links
preview properly in WhatsApp and Facebook. That only happens when this server
serves the site, so check SEO tags against `npm start`, not `npm run dev`.

# Docker

The whole application runs as one container: the Express server serves the
built site and the API together.

```bash
cp .env.example .env          # then set ADMIN_TOKEN
docker compose up -d --build  # http://localhost:4000
```

| | |
| --- | --- |
| `docker compose logs -f` | follow logs |
| `docker compose down` | stop (content is kept) |
| `docker compose up -d --build` | redeploy after code changes |

Content lives in the `rg-data` volume, **not** in the image — rebuilding
keeps it. That volume holds `db.json` *and* every image and video uploaded
from `/admin`, so back up the whole directory:

```bash
docker compose cp app:/app/data ./rg-data-backup
```

To develop inside containers instead (Vite on :3000 with hot reload, API on
:4000), use `docker compose -f compose.dev.yaml up`. Running `npm run dev` on
the host is faster if you have Node installed.

# Deploying

Pushing to `master` builds the image, pushes it to GHCR, and restarts the
container on the server — see `.github/workflows/deploy.yml`. You can also
run it by hand from the repository's **Actions** tab. The server only pulls;
it never builds.

## One-time setup

Add these under **Settings → Secrets and variables → Actions**:

| Secret | | |
| --- | --- | --- |
| `SSH_HOST` | required | server hostname or IP |
| `SSH_USER` | required | user to log in as; must be able to run `docker` |
| `SSH_PASSWORD` | required | that user's SSH password |
| `SSH_PORT` | optional | defaults to `22` |
| `DEPLOY_PATH` | optional | defaults to `/srv/rg` |

Then, on the server, create the deploy directory and its `.env`:

```bash
sudo mkdir -p /srv/rg && sudo chown "$USER" /srv/rg
cd /srv/rg
printf 'ADMIN_TOKEN=%s\n' "$(node -e 'console.log(crypto.randomUUID())')" > .env
```

`compose.prod.yaml` is copied there by the workflow, so there is nothing else
to put on the server. The `.env` is yours and deploys never touch it — set
`HOST_PORT` and `CORS_ORIGIN` there too if the defaults don't fit.

The first deploy also creates a `production` environment in the repository;
if you want a manual approval gate before anything reaches the server, add a
required reviewer to it under **Settings → Environments**.

## What a deploy does

1. Builds the image and pushes it as `ghcr.io/markwasfy00/rcontracts`, tagged
   both `:latest` and `:<short-sha>`.
2. SSHes in, logs in to GHCR with a token that expires when the job ends,
   pulls the commit-pinned tag, and runs `docker compose up -d`.
3. Waits up to five minutes for the container's healthcheck to pass, and
   prints the last 50 log lines if it doesn't.

Content lives in the `rg-data` volume, so deploys never reset the site.

**To roll back**, re-run the workflow from the older commit — the Actions run
for that commit deploys the image tagged with its SHA, which is still in the
registry.

If the package is private, the server needs no stored registry credentials —
the workflow logs in and out around each pull.

## A note on password auth

The deploy logs in with `SSH_PASSWORD` via `sshpass`, so the server needs
`PasswordAuthentication yes` in `/etc/ssh/sshd_config`. That means your real
server password sits in GitHub and is accepted from anywhere — a deploy key
would be narrower and revocable on its own. To switch later:

1. `ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/rg_deploy -N ""`
2. Append `rg_deploy.pub` to `~/.ssh/authorized_keys` on the server.
3. Replace the `SSH_PASSWORD` secret with the private key as `SSH_KEY`, and in
   `deploy.yml` write it to `~/.ssh/id_deploy` instead of installing sshpass,
   point `IdentityFile` at it, and drop the `sshpass -e` prefixes.

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling.

### Removing Tailwind CSS

If you prefer not to use Tailwind CSS:

1. Remove the demo pages in `src/routes/demo/`
2. Replace the Tailwind import in `src/styles.css` with your own styles
3. Remove `tailwindcss()` from the plugins array in `vite.config.ts`
4. Remove `@tailwindcss/vite` and `tailwindcss` from `package.json`



## Routing

This project uses [TanStack Router](https://tanstack.com/router) with file-based routing. Routes are managed as files in `src/routes`.

### Adding A Route

To add a new route to your application just add a new file in the `./src/routes` directory.

TanStack will automatically generate the content of the route file for you.

Now that you have two routes you can use a `Link` component to navigate between them.

### Adding Links

To use SPA (Single Page Application) navigation you will need to import the `Link` component from `@tanstack/react-router`.

```tsx
import { Link } from "@tanstack/react-router";
```

Then anywhere in your JSX you can use it like so:

```tsx
<Link to="/about">About</Link>
```

This will create a link that will navigate to the `/about` route.

More information on the `Link` component can be found in the [Link documentation](https://tanstack.com/router/v1/docs/framework/react/api/router/linkComponent).

### Using A Layout

In the File Based Routing setup the layout is located in `src/routes/__root.tsx`. Anything you add to the root route will appear in all the routes. The route content will appear in the JSX where you render `{children}` in the `shellComponent`.

Here is an example layout that includes a header:

```tsx
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'My App' },
    ],
  }),
  shellComponent: ({ children }) => (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <header>
          <nav>
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
          </nav>
        </header>
        {children}
        <Scripts />
      </body>
    </html>
  ),
})
```

More information on layouts can be found in the [Layouts documentation](https://tanstack.com/router/latest/docs/framework/react/guide/routing-concepts#layouts).

## Server Functions

TanStack Start provides server functions that allow you to write server-side code that seamlessly integrates with your client components.

```tsx
import { createServerFn } from '@tanstack/react-start'

const getServerTime = createServerFn({
  method: 'GET',
}).handler(async () => {
  return new Date().toISOString()
})

// Use in a component
function MyComponent() {
  const [time, setTime] = useState('')
  
  useEffect(() => {
    getServerTime().then(setTime)
  }, [])
  
  return <div>Server time: {time}</div>
}
```

## API Routes

You can create API routes by using the `server` property in your route definitions:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'

export const Route = createFileRoute('/api/hello')({
  server: {
    handlers: {
      GET: () => json({ message: 'Hello, World!' }),
    },
  },
})
```

## Data Fetching

There are multiple ways to fetch data in your application. You can use TanStack Query to fetch data from a server. But you can also use the `loader` functionality built into TanStack Router to load the data for a route before it's rendered.

For example:

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/people')({
  loader: async () => {
    const response = await fetch('https://swapi.dev/api/people')
    return response.json()
  },
  component: PeopleComponent,
})

function PeopleComponent() {
  const data = Route.useLoaderData()
  return (
    <ul>
      {data.results.map((person) => (
        <li key={person.name}>{person.name}</li>
      ))}
    </ul>
  )
}
```

Loaders simplify your data fetching logic dramatically. Check out more information in the [Loader documentation](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#loader-parameters).



# Learn More

You can learn more about all of the offerings from TanStack in the [TanStack documentation](https://tanstack.com).

For TanStack Start specific documentation, visit [TanStack Start](https://tanstack.com/start).
