import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem, type Post } from '@/types';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import TiptapEditor from '@/components/markdown/tiptap-editor';
import { ExternalLink, Eye, Save, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import CoverUploader from './partials/CoverUploader';
import { show } from '@/routes/posts';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Edit Post',
        href: dashboard().url,
    },
];

export default function EditPost() {
    const page = usePage().props as any;
    const post = page.post as Post;
    const types = page.types as Record<string, string>;
    const statuses = page.statuses as Record<string, string>;

    const { data, setData, post: submit, processing, errors, transform } = useForm<FormDataType>({
        title: post.title || '',
        slug: post.slug || '',
        summary: post.summary || '',
        content: post.content || '',
        content_html: (post as any).content_html || '',
        type: post.type as unknown as number,
        status: post.status as unknown as number,
        category: (post as any).category || '',
        cover: null,
        remove_cover: false,
    });

    type FormDataType = {
        title: string;
        slug: string;
        summary: string;
        content: string;
        content_html?: string;
        type: number;
        status: number;
        category: string;
        cover: File | null;
        remove_cover: boolean;
    }

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // HTML snapshot is kept in sync by the editor via onChangeHtml
        // Force POST with method spoofing so PHP parses multipart body
        transform((form) => ({ ...(form as any), _method: 'put' }));
        submit(`/posts/${post.id}` as string, {
            forceFormData: true,
            onSuccess: () => { },
        } as any);
    };

    // Keyboard shortcut: Ctrl/Cmd + S to save changes
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                if (processing) return;
                // Mirror onSubmit: method spoofing + multipart
                transform((form) => ({ ...(form as any), _method: 'put' }));
                submit(`/posts/${post.id}` as string, {
                    forceFormData: true,
                    onSuccess: () => { },
                } as any);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [post.id, processing, submit, transform]);

    // Live preview is not needed; Tiptap shows formatting inline

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Post" />
            <form onSubmit={onSubmit} className='flex flex-wrap'>
                <div className="px-4 py-6 bg-muted grow">
                    <div className='mx-auto max-w-4xl'>
                        <div className="flex gap-4 items-center justify-center mb-4">
                            <input id="title" className='text-4xl lg:text-6xl tracking-tight w-full rounded-md' value={data.title} onChange={(e) => setData('title', e.target.value)} aria-invalid={!!errors.title} placeholder='New Post'/>
                            <a href={show(post.id).url} target='_blank'>
                                <ExternalLink className='size-6 lg:size-8' />
                            </a>
                        </div>
                        {errors.title && <p className="text-xs text-destructive my-1">{errors.title}</p>}
                        {errors.content && <p className="text-xs text-destructive my-1">{errors.content}</p>}
                        <TiptapEditor
                            value={data.content}
                            onChange={(json) => setData('content', json)}
                        />
                    </div>
                </div>
                <div className="flex flex-col items-stretch border-l sticky top-0 basis-xs divide-y editor-sidebar">
                    <div className="grow flex gap-4 p-4">
                        <Button type="submit" className='w-fit' disabled={processing}>Save Changes</Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => {
                                if (confirm('Delete this post? This cannot be undone.')) {
                                    router.delete(`/posts/${post.id}`);
                                }
                            }}
                        >
                            <Trash2 className="mr-1 h-4 w-4" /> Delete Post
                        </Button>
                    </div>
                    <div className='flex gap-2 flex-wrap'>
                        <div className="grow basis-xs">

                            <Label>Status</Label>
                            <Select value={String(data.status)} onValueChange={(v) => setData('status', Number(v))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {Object.entries(statuses).map(([key, label]) => (
                                            <SelectItem key={key} value={String(key)}>{label}</SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grow basis-xs">
                            <Label>Slug</Label>
                            <div className='flex gap-2 items-center'>
                                <Input id="slug" value={data.slug} onChange={(e) => setData('slug', e.target.value)} aria-invalid={!!errors.slug} />
                            </div>
                            {errors.slug && <p className="text-xs text-destructive mt-1">{errors.slug}</p>}
                        </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <div className='grow basis-xs'>
                            <Label>Type</Label>
                            <Select value={String(data.type)} onValueChange={(v) => setData('type', Number(v))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {Object.entries(types).map(([key, label]) => (
                                            <SelectItem key={key} value={String(key)}>{label}</SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className='grow basis-xs'>
                            <Label htmlFor="category">Category</Label>
                            <Input id="category" value={data.category} onChange={(e) => setData('category', e.target.value)} aria-invalid={!!errors.category} />
                            {errors.category && <p className="text-xs text-destructive mt-1">{errors.category}</p>}
                        </div>
                    </div>
                    <div>
                        <CoverUploader postId={post.id} title={post.title} initialPreview={post.cover_url ?? null} />
                    </div>

                    <div>
                        <Label htmlFor="summary">Summary</Label>
                        <Textarea id="summary" value={data.summary} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('summary', e.target.value)} rows={4} />
                        {errors.summary && <p className="text-xs text-destructive mt-1">{errors.summary}</p>}
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
