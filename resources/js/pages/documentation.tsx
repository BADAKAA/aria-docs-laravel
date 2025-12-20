import React, { useEffect, useRef } from 'react';
import GuestLayout from '@/layouts/guest-layout';
import { Post } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Typography } from '@/components/typography';
import { Leftbar } from '@/components/leftbar';
import Toc from '@/components/toc';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { extractTocFromHtml } from '@/lib/markdown-react';
import { ucfirst } from '@/lib/utils';
import DocsPagination from '@/components/docs-pagination';
import { Edit } from 'lucide-react';
import ReadOnlyBlockNote from '@/blocks/BlockRenderer';
import { setSanitizedHTML } from '@/utils/sanitize';
// Compute prev/next from DB-provided index list


export default function Documentation() {
    const page = usePage().props as any;
    const post = page.post as Post;
    const blocks = JSON.parse((post as any)?.content) as Array<{ type: string; props?: any }> | undefined;
    const contentRef = useRef<HTMLDivElement | null>(null);
    const isLoggedIn = Boolean(page?.auth?.user || page?.user);
    const index = (page.index || []) as Array<{ id:number; title:string; slug:string; category?:string|null; parent_id:number|null; position?:number }>;
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

    const tocItems = extractTocFromHtml(post.content_html || '');

    useEffect(() => {
        if (!Array.isArray(blocks) || blocks.length === 0) {
            setSanitizedHTML(contentRef.current, post.content_html || '');
        }
    }, [post?.content_html, blocks]);

    // Build ordered DFS list from index (position, then title)
    const byParent = new Map<number|null, typeof index>();
    for (const it of index) {
        const list = byParent.get(it.parent_id) || [];
        list.push(it);
        byParent.set(it.parent_id, list);
    }
    for (const [k, list] of byParent) {
        list.sort((a,b) => (a.position ?? 0) - (b.position ?? 0) || a.title.localeCompare(b.title));
        byParent.set(k, list);
    }
    const order: typeof index = [];
    const walk = (pid: number|null) => {
        const children = byParent.get(pid) || [];
        for (const c of children) {
            order.push(c);
            walk(c.id);
        }
    };
    walk(null);
    const currentIdx = order.findIndex(it => it.slug === post.slug);
    const prev = currentIdx > 0 ? { title: order[currentIdx - 1].title, href: `/${order[currentIdx - 1].slug}` } : undefined;
    const next = currentIdx >= 0 && currentIdx < order.length - 1 ? { title: order[currentIdx + 1].title, href: `/${order[currentIdx + 1].slug}` } : undefined;
    console.log(blocks);
    

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
                                    {Array.isArray(blocks) && blocks.length > 0 ? (
                                        <ReadOnlyBlockNote blocks={blocks} />
                                    ) : post.content_html ? (
                                        <div ref={contentRef} className="prose dark:prose-invert" />
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
