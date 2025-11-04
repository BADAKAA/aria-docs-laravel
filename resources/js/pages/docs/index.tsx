import GuestLayout from '@/layouts/guest-layout';
import { Head } from '@inertiajs/react';

export default function DocsIndex() {
    return (
        <GuestLayout>
            <Head title="Documentation" />
            <article className="prose dark:prose-invert max-w-none">
                <h1 className="text-2xl font-bold">Documentation</h1>
                <p>Welcome to the docs. Wire this page to list your sections.</p>
            </article>
        </GuestLayout>
    );
}
