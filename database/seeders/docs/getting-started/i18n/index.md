This CMS does not use Next.js dictionaries or MDX. Instead, organize multi-language content using categories and hierarchy.

## Recommended Structure

- Create a root doc for each language (e.g., `en`, `fr`) by setting a Category or creating top-level docs named after the locale.
- Nest pages under the language root using the Parent field.
- The full slug for a nested doc includes parent segments (e.g., `en/getting-started/introduction`).

## Workflow

1. Create a root doc for each language.
2. For each language, create child pages under the appropriate root.
3. Use Docs Order to reorder and move pages between parents.
4. The system recomputes slugs after re-parenting or renaming.

## Accessing Content

- Docs pages are available at `/docs/{full-slug}`.
- Search works across titles, summaries, and full slugs.

## Tips

- Keep categories consistent per language to simplify navigation.
- Use clear “Slug Name” values (short, URL-safe) for predictable slugs.
- Media Library supports language-specific assets; upload and reference as needed.

This approach keeps multi-language docs straightforward and consistent with the CMS features: Laravel + Inertia, ShadcnUI components, Blocknote editing, and hierarchical ordering.