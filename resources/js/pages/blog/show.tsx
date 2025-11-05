import GuestLayout from '@/layouts/guest-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Post } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import ReactMarkdown from 'react-markdown';
import { rmComponents, rmRemarkPlugins, rmRehypePlugins } from '@/lib/markdown-react';
import { MDXProviderWrapper, loadAllBlogs } from '@/lib/markdown';
import { buttonVariants } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Typography } from '@/components/typography';

export default function BlogShow() {
    const post = usePage().props.post as Post;
    const blogs = loadAllBlogs();
    const mdxBlog = blogs.find(b => b.slug === post.slug);
    return (
        <GuestLayout>
            <Head title={post.title} />
            <div className="pt-2 lg:w-[60%] sm:[95%] md:[75%] mx-auto">
                <a
                    className={buttonVariants({
                        variant: "link",
                        className: "!mx-0 !px-0 mb-7 !-ml-1 font-normal",
                    })}
                    href="/blog"
                >
                    <ArrowLeft className="size-4 mr-1 mb-px" /> Back to blog
                </a>
                {/* Header */}
                <div className="mb-5 flex flex-col gap-2">
                    <p className="text-sm text-muted-foreground">
                        {formatDate(post.published_at)}
                    </p>
                    <h1 className="sm:text-3xl text-2xl font-extrabold">{post.title}</h1>
                    {/* {post.summary && (
                        <p className="text-muted-foreground sm:text-[16.5px] text-[14.5px]">
                            {post.summary}
                        </p>
                    )} */}
                    {post.author && (
                        <div >
                            <p className='text-sm text-muted-foreground mt-6 mb-2'>Posted By</p>
                            <div className="flex items-center gap-3">
                                <Avatar className="size-10 border-2 border-background">
                                    <AvatarImage src={post.author.avatar ?? ''} alt={post.author.name} />
                                    <AvatarFallback>
                                        {post.author.name?.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{post.author.name}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Cover */}
                {post.cover_url && (
                    <div className="w-full mb-6">
                        <img
                            src={post.cover_url}
                            alt={post.title}
                            width={1200}
                            height={480}
                            className="w-full rounded-md object-cover max-h-[420px] border"
                        />
                    </div>
                )}

                {/* Content */}
                <article className="prose dark:prose-invert max-w-none markdown">
                    <Typography>
                        {mdxBlog ? (
                            <MDXProviderWrapper>
                                <mdxBlog.Component />
                            </MDXProviderWrapper>
                        ) : post.content ? (
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
                    </Typography>
                </article>
                <div className="h-4"></div>
            </div>
        </GuestLayout>
    );
}
