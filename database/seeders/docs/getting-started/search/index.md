The CMS includes a simple search endpoint that queries public posts.

## Endpoint
- `GET /search?q={term}`
- Returns JSON with up to 10 recent results.

## Behavior
- Searches `title`, `summary`, and full `slug`.
- Only returns `PUBLIC` posts with `published_at` not in the future.
- Results include an absolute URL to the page (blog or docs).

## Example Response
```json
{
  "data": [
    {
      "id": 12,
      "title": "Quick Start Guide",
      "summary": "How to get started",
      "slug": "getting-started/quick-start-guide",
      "type": "docs",
      "url": "https://your-app.test/docs/getting-started/quick-start-guide"
    }
  ]
}
```

On the Dashboard, you can also filter posts by title, summary, and short slug name.

Search is designed for speed and relevance; for advanced indexing, you can integrate external search services later.