# API Surface

The MVP backend should expose a small provider-neutral API.

## Auth

- `POST /api/auth/signup` — create account
- `POST /api/auth/login` — create session
- `POST /api/auth/logout` — end session
- `GET /api/auth/me` — current user and client membership

## Client

- `GET /api/client` — current client workspace
- `PATCH /api/client` — update workspace settings

## Connections

- `GET /api/connections` — connection status only
- `POST /api/connections/:provider/start` — begin OAuth flow
- `GET /api/connections/:provider/callback` — finish OAuth flow
- `DELETE /api/connections/:provider` — disconnect

Supported MVP providers: `youtube`, `instagram`.

## Publishing

- `POST /api/jobs` — create a publishing job
- `GET /api/jobs` — list current client's jobs
- `GET /api/jobs/:id` — read one job

The server validates plan limits before accepting a job. It sends the Make contract payload only after the job is persisted.

## Make callback

- `POST /api/make/callback` — receive authenticated job status updates

The callback endpoint is server-to-server. It must verify its shared secret/signature and must never rely on a browser session.

## Response rules

- Return generic errors to clients; keep provider credentials and internal error details server-side.
- Never return access tokens or refresh tokens.
- All client-owned resources are authorized through server-side membership checks.
