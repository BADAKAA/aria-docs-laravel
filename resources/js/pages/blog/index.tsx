import BlogController from '@/actions/App/Http/Controllers/BlogController';
import Pagination from '@/components/pagination';
import GuestLayout from '@/layouts/guest-layout';
import { formatDateShort } from '@/lib/utils';
import { Post } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

export default function BlogIndex() {
    const posts = usePage().props.posts as any;
    
    return (
        <GuestLayout>
            <Head title="Blog" />
            <div className="flex flex-col gap-1 sm:min-h-[91vh] min-h-[88vh] pt-10">
                <div className="mb-7 flex flex-col gap-2">
                    <h1 className="sm:text-3xl text-2xl font-extrabold">
                        The latest blogs of this product
                    </h1>
                    <p className="text-muted-foreground sm:text-[16.5px] text-[14.5px]">
                        All the latest blogs and news, straight from the team.
                    </p>
                </div>
                <div className="grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 sm:gap-8 gap-4 mb-5">
                    {posts.data.map((post:Post) => (
                        <BlogCard post={post} key={post.slug} />
                    ))}
                </div>
            </div>
            <Pagination data={posts} />
        </GuestLayout>
    );
}

function BlogCard({ post }: { post: Post }) {
    return (
        <Link
            href={`/blog/${post.slug}`}
            className="flex flex-col gap-2 items-start border rounded-md py-4 px-3 min-h-[400px]"
        >
            <h3 className="text-md font-semibold min-h-12">{post.title}</h3>
            <div className="w-full my-1">
                <img
                    src={post.cover_url}
                    alt={post.title}
                    className="w-full rounded-md aspect-[2/1] object-cover border"
                />
            </div>
            <p className="text-sm text-muted-foreground mb-2">{post.summary}</p>
            <div className="flex items-center justify-between w-full mt-auto">
                <p className="text-[13px] text-muted-foreground">
                    Published on {formatDateShort(post.published_at)}
                </p>
            </div>
        </Link>
    );
}
