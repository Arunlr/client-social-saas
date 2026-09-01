# Cloudflare deployment

The Cloudflare Worker is the persistent, $0-first runtime for the MVP. It serves the API from a D1 database and, when deployed with Wrangler, serves the dashboard static assets from `../app` in the same deployment.

## Current account resources

- D1 database: `client-social-saas` (`57fe308b-bda5-4226-ad10-5f8dd4c92bab`), created in APAC with read replication disabled.
- Worker: `client-social-saas`, uploaded with the `DB` D1 binding and observability enabled.
- Schema: the initial tenant-aware schema is applied and tracked in `migrations/0001_initial_schema.sql`.

The account does not yet have a `workers.dev` subdomain. Open **Workers & Pages** once in the Cloudflare dashboard to initialize it, then deploy from this directory to publish the dashboard and API together.

## Local development

```sh
cd cloudflare
npm install
npm run dev
```

Use a local `.dev.vars` file for development-only secrets. It is ignored by Git.

## Production deployment

1. Initialize the account's `workers.dev` subdomain in the Cloudflare dashboard.
2. Set `APP_BASE_URL` in `wrangler.jsonc` to the resulting Worker URL.
3. Install dependencies: `npm install`.
4. Apply any pending migrations: `npx wrangler d1 migrations apply client-social-saas --remote`.
5. Add production secrets—never commit them:

   ```sh
   npx wrangler secret put MAKE_WEBHOOK_URL
   npx wrangler secret put MAKE_CALLBACK_SECRET
   ```

6. Validate: `npm run check`.
7. Deploy the Worker and dashboard assets together: `npm run deploy`.

The deployed API remains safe while the Make secrets are absent: job creation records the job but does not call Make, and callbacks are rejected.

## $0-first scope

D1 stores only relational application data: users, client memberships, sessions, job metadata, results, and plan limits. Media files should remain external URLs for the MVP; use R2 only if object storage is required later. Worker logs are enabled for operational debugging; monitor usage before adding paid services.
