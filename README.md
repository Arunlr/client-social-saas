# Client Social SaaS

Zero-budget MVP for a client-facing social publishing service powered by Make.

## Goal
Clients connect their publishing workflow once, then manage content and publishing from a simple dashboard. Make remains the automation engine.

## Principles
- $0-first architecture
- No secrets committed to Git
- Client data isolated by client ID
- YouTube + Instagram first
- Facebook intentionally excluded for MVP
- Easy migration to paid infrastructure later

## MVP layers
1. Client web dashboard
2. Authentication and client configuration
3. Publishing job/history model
4. Make webhook integration
5. YouTube + Instagram publishing
6. Usage/plan limits

## Security
Never commit API keys, OAuth secrets, refresh tokens, Make secrets, or social access tokens. Keep credentials server-side and in environment variables when the backend is introduced.
