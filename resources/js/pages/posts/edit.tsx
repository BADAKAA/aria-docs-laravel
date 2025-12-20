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
import { renderMarkdownToHtml } from '@/lib/markdown-render';
import { Eye, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

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
        // Precompute HTML snapshot on the client using Markdown renderer
        try {
            const html = await renderMarkdownToHtml(data.content || '');
            setData('content_html', html);
        } catch (err) {
            console.error('Markdown render failed', err);
            // continue without content_html
        }
        // Force POST with method spoofing so PHP parses multipart body
        transform((form) => ({ ...(form as any), _method: 'put' }));
        submit(`/posts/${post.id}` as string, {
            forceFormData: true,
            onSuccess: () => { },
        } as any);
    };

    // Cover form state (separate Inertia form for CSRF + redirects)
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(post.cover_url ?? null);
    const { data: coverData, setData: setCoverData, post: postCover, delete: destroyCover, processing: coverProcessing } = useForm<{ cover: File | null }>({ cover: null });

    const onCoverChange = (file: File | null) => {
        setCoverFile(file);
        setCoverData('cover', file);
        if (file) {
            const url = URL.createObjectURL(file);
            setCoverPreview(url);
        } else {
            setCoverPreview(post.cover_url ?? null);
        }
    };

    const onCoverDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files?.[0] ?? null;
        if (file && file.type.startsWith('image/')) onCoverChange(file);
    };
    const onCoverDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const submitCover = () => {
        if (!coverFile) return;
        postCover(`/posts/${post.id}/cover`, { forceFormData: true, onFinish: () => setCoverFile(null) } as any);
    };

    const deleteCover = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        destroyCover(`/posts/${post.id}/cover`, { onSuccess: () => setCoverPreview(null) } as any);
    };

    // Sync preview from server after Inertia navigation/redirect
    useEffect(() => {
        setCoverPreview(post.cover_url ?? null);
    }, [post.cover_url]);

    // Live preview is not needed; Tiptap shows formatting inline

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Post" />
            <form onSubmit={onSubmit} className="space-y-6 p-4">
                <div className="flex flex-wrap gap-4">
                    <Card className="grow basis-lg p-4 lg:col-span-2">
                        <div className="flex gap-4 flex-wrap">
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
                            <div className='grow basis-xs'>
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
                        </div>
                        <div className="flex gap-4 flex-wrap">
                            <div className='grow basis-xs'>
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" value={data.title} onChange={(e) => setData('title', e.target.value)} aria-invalid={!!errors.title} />
                                {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
                            </div>
                            <div className='grow basis-xs'>
                                <Label htmlFor="slug">Slug</Label>
                                <Input id="slug" value={data.slug} onChange={(e) => setData('slug', e.target.value)} aria-invalid={!!errors.slug} />
                                {errors.slug && <p className="text-xs text-destructive mt-1">{errors.slug}</p>}
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="summary">Summary</Label>
                            <Textarea id="summary" value={data.summary} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('summary', e.target.value)} rows={4} />
                            {errors.summary && <p className="text-xs text-destructive mt-1">{errors.summary}</p>}
                        </div>
                        <div className="flex items-center gap-2">
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

                    </Card>
                    <div className="space-y-4 basis-sm">
                        <Card className="p-4 ">
                            <div className="space-y-3">
                                <Label>Cover</Label>
                                <div
                                    className="border rounded-md p-2 bg-muted/40 hover:bg-muted/60 transition-colors cursor-pointer"
                                    onDrop={onCoverDrop}
                                    onDragOver={onCoverDragOver}
                                    onClick={() => document.getElementById('cover-input')?.click()}
                                >
                                    {coverPreview ? (
                                        <img src={coverPreview} alt={post.title} className="w-full rounded border" />
                                    ) : (
                                        <div className="text-sm text-muted-foreground text-center py-8">
                                            Drag & drop an image here, or click to select
                                        </div>
                                    )}
                                </div>
                                <Input id="cover-input" type="file" accept="image/*" className="hidden" onChange={(e) => onCoverChange(e.target.files?.[0] || null)} />
                                {errors.cover && <p className="text-xs text-destructive mt-1">{errors.cover}</p>}
                                <div className="flex items-center gap-2">
                                    <Button type="button" variant="default" disabled={!coverFile || coverProcessing} onClick={submitCover}>Update</Button>
                                    <Button type="button" variant="destructive" onClick={deleteCover} disabled={!coverPreview || coverProcessing}>
                                        <Trash2 className="mr-1 h-4 w-4" /> Delete
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
                <Label htmlFor="content">Content</Label>
                <Card className="!gap-0 !p-0">
                    <div className='-m-px'>
                        <TiptapEditor value={data.content} onChange={(md) => setData('content', md)} className='lg:min-h-full' />
                        {errors.content && <p className="text-xs text-destructive mt-1">{errors.content}</p>}
                    </div>
                </Card>
            </form>
        </AppLayout>
    );
}
