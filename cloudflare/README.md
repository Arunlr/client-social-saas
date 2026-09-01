# Cloudflare deployment

Cloudflare D1 is the persistent database target for the zero-budget MVP. Cloudflare documents D1 as available on the Workers Free plan, with free daily row-read/write allowances and included storage. The application must monitor those limits because Cloudflare began enforcing the free-tier daily limits on September 1, 2026.

## One-time setup

1. Create a Cloudflare account.
2. Install Wrangler locally: `npm install -g wrangler`.
3. Authenticate: `wrangler login`.
4. Create the database: `wrangler d1 create client-social-saas`.
5. Put the returned database ID into `wrangler.toml`.
6. Apply the schema: `wrangler d1 execute client-social-saas --remote --file=./schema.sql`.
7. Add secrets with Wrangler, never Git: `wrangler secret put SESSION_SECRET`, `wrangler secret put MAKE_CALLBACK_SECRET`, and `wrangler secret put MAKE_WEBHOOK_URL`.
8. Deploy the Worker: `wrangler deploy`.

## Important $0 constraint

Do not rely on local disk for application state. D1 is persistent and serverless. Free-tier usage is capped, so indexes and tenant-scoped queries are required to avoid unnecessary row scans.

The `wrangler.toml` contains a placeholder database ID and example hostname only. Replace those during deployment; do not commit account secrets or tokens.
