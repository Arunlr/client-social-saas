# Architecture

## MVP flow

Client browser -> SaaS application -> client configuration/job API -> Make -> YouTube + Instagram.

The browser must never contain platform secrets or Make secrets.

## Multi-tenant model

Every customer-owned record is scoped by `client_id`. A future server-side authorization layer must enforce that scope; UI filtering alone is not sufficient.

Core entities:

- `users`: authenticated people
- `clients`: customer/workspace records
- `memberships`: user-to-client access
- `social_connections`: provider connection metadata; secrets stay server-side
- `publishing_jobs`: requested/processing/completed/failed jobs
- `publishing_results`: platform result metadata
- `plans`: plan definitions and limits
- `subscriptions`: customer plan state
- `usage_events`: metering events

## Make integration

Prefer a webhook/API boundary between the SaaS and Make. The SaaS creates a job with a stable job ID and client ID. Make processes the job and posts a status callback to the backend.

Do not clone the Make scenario per customer. The same automation should select client configuration using the job/client ID.

## Zero-budget constraints

Prefer open-source/self-hostable components and free tiers. Avoid introducing paid dependencies until revenue exists. Keep the application portable so the database, hosting, and billing layers can be replaced later.

## MVP scope

Included: authentication, onboarding, connection/configuration screens, publishing jobs, history, usage, Make integration, YouTube and Instagram.

Excluded initially: Facebook, advanced analytics, team roles beyond basic membership, paid AI dependencies, and complex billing automation.
