import GuestLayout from '@/layouts/guest-layout';
import { Post } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { MDXProviderWrapper, loadAllDocs, getPreviousNext } from '@/lib/markdown';
import { Typography } from '@/components/typography';
import { Leftbar } from '@/components/leftbar';
import Toc from '@/components/toc';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { extractTocFromMarkdown } from '@/lib/markdown-react';
import { ucfirst } from '@/lib/utils';
import DocsPagination from '@/components/docs-pagination';
import { Edit, Pencil } from 'lucide-react';


export default function Documentation() {
    const page = usePage().props as any;
    const post = page.post as Post;
    const isLoggedIn = Boolean(page?.auth?.user || page?.user);
    const parents = post.slug.split('/').map(part => ({
        title: ucfirst(part.replaceAll('-', ' ')),
        href: '/docs/' + (post.slug?.split('/').slice(0, post.slug!.split('/').indexOf(part) + 1).join('/') ?? ''),
    }));
    parents.pop();
    const breadcrumbs = [{
        title: 'Documentation',
        href: '/docs',
    },
    ...parents,
    {
        title: post.title,
        href: '/docs/' + (post.slug ?? ''),
    }
    ]

    const tocItems = extractTocFromMarkdown(post.content || '');

    // Resolve MDX component by slug using eager MDX modules for SSR
    const docs = loadAllDocs();
    const currentDoc = docs.find(d => d.slug === post.slug);

    const { prev, next } = getPreviousNext(post.slug);

    return (
        <GuestLayout>
            <Head title={post.title} />
            <div className="flex items-start gap-8 w-full max-[90vw] mx-auto">
                <Leftbar />
                <div className="flex-[5.25]">
                    <div className="flex items-start gap-10">
                        <div className="flex-[4.5] mx-auto py-4 md:py-10">
                            <Breadcrumbs breadcrumbs={breadcrumbs} />
                            <div className="h-5"></div>
                            <Typography>
                                <h1 className="sm:text-3xl text-2xl !-mt-0.5">
                                    {isLoggedIn ? (
                                        <Link href={`/posts/${post.id}/edit`} className="flex  gap-2 items-center no-underline hover:underline decoration-dotted">
                                            {post.title}
                                            <Edit className='size-[1em]'/>
                                        </Link>
                                    ) : (
                                        post.title
                                    )}
                                </h1>
                                {post.summary && (
                                    <p className="mb-4 text-muted-foreground sm:text-[16.5px] text-[14.5px]">{post.summary}</p>
                                )}
                                <div>
                                    {currentDoc ? (
                                        <MDXProviderWrapper>
                                            <currentDoc.Component />
                                        </MDXProviderWrapper>
                                    ) : post.content ? (
                                        // Fallback to markdown renderer if no MDX module matched
                                        <div className="prose dark:prose-invert">{post.content}</div>
                                    ) : (
                                        <p className="mt-6 text-muted-foreground">No content.</p>
                                    )}
                                </div>
                                <DocsPagination prev={prev} next={next} />
                            </Typography>
                        </div>
                        <Toc items={tocItems} />
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
