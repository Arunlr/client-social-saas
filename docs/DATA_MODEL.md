# Data Model

This is the provider-neutral logical model for the MVP. It can be implemented in PocketBase, SQLite, Postgres, or another free/self-hosted backend.

## users
- `id`
- `email`
- `display_name`
- `created_at`

## clients
- `id`
- `name`
- `owner_user_id`
- `status` (`active`, `paused`)
- `created_at`

## memberships
- `id`
- `client_id`
- `user_id`
- `role` (`owner`, `member`)

## social_connections
- `id`
- `client_id`
- `provider` (`youtube`, `instagram`)
- `external_account_id`
- `display_name`
- `status`
- `secret_reference`
- `created_at`
- `updated_at`

`secret_reference` points to server-side secret storage. Tokens are never returned to the browser.

## publishing_jobs
- `id`
- `client_id`
- `source_file_url`
- `title`
- `description`
- `status` (`queued`, `processing`, `published`, `failed`)
- `requested_at`
- `started_at`
- `completed_at`
- `error_message`

## publishing_results
- `id`
- `job_id`
- `provider`
- `external_post_id`
- `external_url`
- `status`
- `published_at`

## plans
- `id`
- `name`
- `monthly_job_limit`
- `enabled`

## subscriptions
- `id`
- `client_id`
- `plan_id`
- `status`
- `current_period_start`
- `current_period_end`

## usage_events
- `id`
- `client_id`
- `job_id`
- `event_type`
- `units`
- `created_at`

## Tenant isolation

Every API read/write involving client-owned records must derive the client ID from the authenticated user's membership on the server. Never trust a client-supplied `client_id` as authorization.
