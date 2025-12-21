This CMS uses Tailwind and ShadcnUI for styling, and Blocknote for rich-text editing.

## Styling
- Tailwind config is available; adjust utility classes in React components under `resources/js/components` and pages.
- You can create custom React UI components using ShadcnUI patterns.

## Blocknote Editor
- The editor stores content as JSON; it renders rich text in the Posts Edit screen.
- Extend with custom nodes or plugins if needed.

## Media
- Use the Media Library to upload assets and insert them into content.
- Manage files (rename/delete) from the library.

## Slugs & Ordering
- `slug_name` is an optional short name; the full `slug` is computed based on title, parent, and category.
- Use Docs Order to reorganize the hierarchy; slugs recompute for descendants after changes.

Keep customizations within `resources/js` and standard Laravel config files to stay maintainable.