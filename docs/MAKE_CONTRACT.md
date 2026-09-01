# Make Integration Contract

The SaaS and Make should communicate through stable job payloads rather than provider-specific UI assumptions.

## SaaS -> Make

```json
{
  "event": "publishing.job.created",
  "job_id": "job_xxx",
  "client_id": "client_xxx",
  "source_file_url": "https://example.invalid/video.mp4",
  "title": "Example title",
  "description": "Example description",
  "targets": ["youtube", "instagram"],
  "callback_url": "https://app.example.invalid/api/make/callback"
}
```

## Make -> SaaS callback

```json
{
  "event": "publishing.job.updated",
  "job_id": "job_xxx",
  "client_id": "client_xxx",
  "status": "published",
  "results": [
    {
      "provider": "youtube",
      "external_post_id": "...",
      "external_url": "...",
      "status": "published"
    },
    {
      "provider": "instagram",
      "external_post_id": "...",
      "external_url": "...",
      "status": "published"
    }
  ],
  "error_message": null
}
```

## Required behavior

- `job_id` is idempotent. A duplicate callback must not create a duplicate job.
- `client_id` is used for routing, but server authorization still comes from the authenticated session.
- Callback authentication must use a server-side secret/signature; do not put the secret in frontend JavaScript.
- The SaaS should treat provider results as optional: one target may succeed while another fails.
- Facebook is not part of the MVP contract.
