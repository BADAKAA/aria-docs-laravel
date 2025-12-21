Welcome to the Documentation CMS. It’s a lightweight content system built on Laravel + Inertia (React), using ShadcnUI and the Blocknote editor, with a Media Library and docs ordering features.

## Features
- Docs and Blog posts with hierarchical slugs
- Rich-text editing with Blocknote
- Media Library for image/file uploads
- Drag-and-drop docs ordering
- Simple search across titles, summaries, and slugs
- Public/Private/Draft statuses and publishing dates

## How It Works
- Create Posts (Docs or Blog) from the Dashboard.
- For docs, set `Parent` to build nested structures; `slug_name` is optional and used to compute the full `slug`.
- The full slug is used in routes:
  - Docs: `/docs/{full-slug}`
  - Blog: `/blog/{slug}`
- Media uploads are stored and can be inserted into content.

This CMS focuses on editing and organizing content without MDX components—just write, upload, order, and publish.