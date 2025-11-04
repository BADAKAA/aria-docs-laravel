import DocsLayout from '@/layouts/docs/docs-layout';
import { Head } from '@inertiajs/react';

export default function DocShow({ slug }: { slug: string[] | string }) {
    const title = Array.isArray(slug)
        ? slug[slug.length - 1]
        : slug || 'Docs';

    return (
        <DocsLayout>
            <Head title={title} />
            <article className="prose dark:prose-invert max-w-none">
                <h1 className="text-2xl font-bold capitalize">{title}</h1>
                <p>
                    This is a placeholder for the docs page content at slug:
                    <code className="ml-2 rounded bg-muted px-1 py-0.5 text-sm">
                        {Array.isArray(slug) ? slug.join('/') : slug}
                    </code>
                </p>
            </article>
        </DocsLayout>
    );
}
