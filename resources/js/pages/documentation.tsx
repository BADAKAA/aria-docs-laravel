import GuestLayout from '@/layouts/guest-layout';
import { Post } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import ReactMarkdown from 'react-markdown';
import { rmComponents, rmRemarkPlugins, rmRehypePlugins } from '@/lib/markdown-react';
import { Typography } from '@/components/typography';
import { Leftbar } from '@/components/leftbar';
import Toc from '@/components/toc';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { extractTocFromMarkdown } from '@/lib/markdown-react';
import { ucfirst } from '@/lib/utils';


export default function Documentation() {
    const post = usePage().props.post as Post;
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

    return (
        <GuestLayout fullWidth>
            <Head title={post.title} />
            <div className="flex items-start gap-8 w-full">
                <Leftbar />
                <div className="flex-[5.25] mx-auto">
                    <div className="w-full mx-auto">
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                        <Typography>
                            <h1 className="sm:text-4xl font-bold text-2xl mt-4 mb-8">{post.title}</h1>
                            {post.summary && (
                                <p className="mb-4 text-muted-foreground sm:text-[16.5px] text-[14.5px]">{post.summary}</p>
                            )}
                            <div>
                                {post.content ? (
                                    <ReactMarkdown
                                        remarkPlugins={rmRemarkPlugins as any}
                                        rehypePlugins={rmRehypePlugins as any}
                                        components={rmComponents}
                                    >
                                        {post.content}
                                    </ReactMarkdown>
                                ) : (
                                    <p className="mt-6 text-muted-foreground">No content.</p>
                                )}
                            </div>
                        </Typography>
                    </div>
                </div>
                <Toc items={tocItems} />
            </div>
        </GuestLayout>
    );
}
