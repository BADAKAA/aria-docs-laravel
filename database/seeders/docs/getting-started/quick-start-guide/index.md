This project is a lightweight CMS built with Laravel, Inertia (React), ShadcnUI, and the Blocknote editor. It includes a Media Library for custom uploads and powerful doc ordering to build hierarchical documentation.

## Create a Doc

1. Go to the Dashboard → Posts → New.
2. Fill in:
   - Title: the page title.
   - Type: choose “Docs”.
   - Category: optional label for a docs tree (e.g., "Getting Started").
   - Parent: set a parent doc to nest under an existing page (for hierarchies).
   - Slug Name: a short, URL-safe name (e.g., `quick-start-guide`). The full slug is computed from the hierarchy.
3. Write content using the Blocknote editor (rich text). Save changes.

Docs automatically compute a full path slug. For nested docs, the full slug will include parent segments (e.g., `getting-started/quick-start-guide`).

## Reorder Docs

Use the Docs Order screen to:
- Drag and drop docs within a category.
- Change parent-child relationships to restructure the hierarchy.
- Update positions in bulk. The system recalculates full slugs when hierarchy changes.

## Media Library

- Open Media Library to upload images and files.
- Insert uploaded media into your content.
- Rename or delete assets when needed.

## Blog Posts

1. Create a new Post with Type “Blog”.
2. Use Blocknote to write rich content.
3. The blog post’s full slug is generated from the short slug name or title.

## Status and Publishing

- Status: Draft, Public, or Private.
- Public posts also require a `published_at` date not in the future.
- Search indexes title, summary, and full slug.

## Navigation

- Docs pages resolve at `/docs/{full-slug}`.
- Blog posts resolve at `/blog/{slug}`.

This CMS focuses on simplicity and content editing rather than MDX components. Write content directly in the editor; slugs and routing are handled for you.