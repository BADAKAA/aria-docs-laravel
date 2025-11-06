import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem, type Post } from '@/types';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { buttonVariants } from '@/components/ui/button';
import { Eye, FileText, Globe, Lock, StickyNote, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import Pagination from '@/components/pagination';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

export default function Dashboard() {
    const page = usePage().props as any;
    const posts = page.posts as { data: Post[]; current_page: number; last_page: number; links: Array<{ url: string | null; label: string; active: boolean }>; total: number };
    const types = page.types as Record<string, string>;
    const statuses = page.statuses as Record<string, string>;
    const filters = page.filters as { q?: string; type?: string; status?: string };

    const [q, setQ] = useState(filters.q ?? '');
    const [type, setType] = useState<string>((filters.type ?? '') !== '' ? String(filters.type) : 'all');
    const [status, setStatus] = useState<string>((filters.status ?? '') !== '' ? String(filters.status) : 'all');

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => {
            router.get('/dashboard', { q, type: type === 'all' ? '' : type, status: status === 'all' ? '' : status }, { preserveState: true, replace: true });
        }, 250);
        return () => clearTimeout(t);
    }, [q, type, status]);

    const statusIcon = (s: number) => {
        switch (s) {
            case 1: return <Globe className="text-green-600 dark:text-green-500" size={18} aria-label="Public" />;
            case 2: return <Lock className="text-yellow-600 dark:text-yellow-500" size={18} aria-label="Private"/>;
            default: return <StickyNote className="text-muted-foreground" size={18} aria-label="Draft"/>;
        }
    };

    const typeIcon = (t: number) => {
        switch (t) {
            case 0: return <FileText className="text-blue-600 dark:text-blue-400" size={18} aria-label="Documentation"/>;
            case 1: return <FileText className="text-purple-600 dark:text-purple-400" size={18} aria-label="Blog"/>;
            default: return <FileText size={18}/>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="p-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-3 items-center mb-4">
                    <Input
                        placeholder="Search by title, summary, slug…"
                        className="w-full sm:w-72"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                    <Select value={type} onValueChange={(v) => setType(v)}>
                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="All types" /></SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="all">All types</SelectItem>
                                {Object.entries(types).map(([key, label]) => (
                                    <SelectItem key={key} value={String(key)}>{label}</SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <Select value={status} onValueChange={(v) => setStatus(v)}>
                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Any status" /></SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="all">Any status</SelectItem>
                                {Object.entries(statuses).map(([key, label]) => (
                                    <SelectItem key={key} value={String(key)}>{label}</SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>

                {/* List */}
                <div className="border rounded-md divide-y">
                    {posts.data.length === 0 ? (
                        <div className="p-6 text-sm text-muted-foreground">No posts found.</div>
                    ) : posts.data.map((p) => (
                        <div
                            key={p.id}
                            className="p-3 flex items-center gap-3 cursor-pointer hover:bg-muted/50"
                            role="link"
                            aria-label={`Edit ${p.title}`}
                            tabIndex={0}
                            onClick={() => router.visit(`/posts/${p.id}/edit`)}
                            onKeyDown={(e) => { if (e.key === 'Enter') router.visit(`/posts/${p.id}/edit`); }}
                        >
                            <div className="shrink-0">{statusIcon(p.status)}</div>
                            <div className="shrink-0">{typeIcon(p.type)}</div>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{p.title}</div>
                                <div className="text-xs text-muted-foreground truncate">/{p.slug}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <a className={buttonVariants({ variant: 'ghost', className: 'h-8 px-2' })} href={p.type === 1 ? `/blog/${p.slug}` : `/docs/${p.slug}`} target="_blank" rel="noopener" title="View" onClick={(e) => e.stopPropagation()}>
                                    <Eye size={16} />
                                </a>
                                <button
                                    className={buttonVariants({ variant: 'ghost', className: 'h-8 px-2 text-destructive hover:text-destructive' })}
                                    title="Delete"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Delete \"${p.title}\"? This cannot be undone.`)) {
                                            router.delete(`/posts/${p.id}`);
                                        }
                                    }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center mt-4">
                    <div className="text-sm text-muted-foreground mr-auto">Total: {posts.total}</div>
                    <Pagination data={posts} align="right" />
                </div>
            </div>
        </AppLayout>
    );
}
