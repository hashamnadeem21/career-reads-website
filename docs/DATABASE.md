# Where content comes from

The website has **no database connection**. Content comes from one of two sources:

| Source | When | Managed in |
| --- | --- | --- |
| The Career Reads API ([`blognest-api`](../../blognest-api)) | `API_URL` is set | The admin panel ([`blognest-admin`](../../blognest-admin)) |
| The files in `content/` | `API_URL` is empty (default, and in the e2e tests) | Git |

Every page goes through the same chain, so neither source is visible to pages:

```
pages/components → src/lib/content/index.ts, src/lib/jobs/index.ts (visibility, sorting, related, search)
                 → ContentRepository (src/lib/content/repository.ts)
                 → ApiContentRepository (API_URL set)  |  MdxContentRepository (files)
```

## Talking to the API

- `src/lib/api/client.ts` is server-only. It sends `X-Api-Key: SITE_API_KEY` on every call, and the visitor's IP (and, for stats, user agent) so the API can rate-limit per visitor and ignore bots.
- Paths are typed from the API's OpenAPI spec. After the API changes, run `npm run api:types` (reads `${API_URL}/docs-json`, default `http://localhost:4000`) and commit `src/lib/api/schema.d.ts`.
- The API decides visibility: drafts, scheduled posts and expired jobs are never returned. In local development with `CONTENT_PREVIEW_DRAFTS=true`, the site asks for drafts with `?preview=1`, which the API allows only with the site key.
- Writes go to the API too: the contact form (`/public/contact`), newsletter (`/public/subscribe`) and page counters (`/api/stats` → `/public/stats`).

## Keeping pages fresh

API reads are wrapped in `unstable_cache` with the tags `articles`, `authors`, `jobs`, `categories` and `settings` (one hour by default). After every save, the API calls this site's `POST /api/revalidate` with `REVALIDATE_SECRET`, naming the tags and paths to refresh, so changes show up within seconds.

## Security note on MDX

MDX can contain JavaScript expressions. That is fine for content written by trusted editors. Keep `disableImports` / `disableExports` enabled in `MdxContent.tsx`, and keep the API's `safe-mdx` check on every saved post.
