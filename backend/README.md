# Backend foundation

This directory contains the provider-neutral server contract and schema for the MVP.

## Responsibilities

The backend will:

1. Authenticate users and create sessions.
2. Resolve the user's client membership server-side.
3. Store client configuration and publishing jobs.
4. Enforce plan/usage limits before creating jobs.
5. Send normalized jobs to Make.
6. Accept authenticated Make callbacks and update job/result records.
7. Keep social credentials and integration secrets off the browser.

## Current implementation strategy

Keep the first backend portable and dependency-light. The schema is SQL-based and can run against a local SQLite database for development, while the API layer can later move to Postgres without changing the product contract.

## Never do

- Never trust a browser-supplied client ID for authorization.
- Never expose refresh/access tokens through API responses.
- Never commit `.env` files or real secrets.
- Never let Make callbacks update a job without verifying the callback secret/signature.
