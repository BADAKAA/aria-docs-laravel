This CMS is built with Laravel + Inertia (React), ShadcnUI components, and the Blocknote editor. Below is a quick tour of the key folders in this project.

## app/
- Controllers: HTTP endpoints like `BlogController`, `DocsController`, `PostController`.
- Models: Eloquent models such as `Post` (handles slugs, covers, ordering).
- Enums/Traits/Providers: Supporting types and behaviors.

## routes/
- `web.php`: Main routes. Docs pages resolve at `docs/{slug}`; blog posts at `blog/{slug}`; admin features (posts, media, ordering) behind auth.

## resources/js/
- Inertia React app with pages, components, and UI.
- Pages: Admin dashboards and editors (e.g., Posts Edit), Media Library.
- Types and utils used by the frontend.

## resources/views/
- Blade views used to bootstrap Inertia and shared layouts.

## database/migrations/
- Schema for posts, users, and related features.
- Posts table includes `slug_name` (short, optional) and `slug` (full path used for routing).

## database/seeders/
- `DocumentationSeeder`: seeds docs content from Markdown files under `database/seeders/docs/**`.
- `DatabaseSeeder`: creates a demo user, sample posts, and seeds documentation.

## public/
- Web entry (`index.php`), built assets, images.

## storage/
- App data, framework cache, logs.
- Media uploads and post covers stored via the Media Library.

## config/
- Application configuration (mail, queue, session, logging, etc.).

## scripts/
- Utility scripts for maintenance or automation (if present).

### How Docs Are Structured
- Docs are hierarchical. Set `parent_id` to nest pages.
- The full `slug` is computed from `slug_name` and parent hierarchy (e.g., `getting-started/quick-start-guide`).
- Use the Docs Order screen to drag-and-drop pages and restructure trees.

This structure keeps the CMS simple and maintainable while enabling rich editing and navigation.