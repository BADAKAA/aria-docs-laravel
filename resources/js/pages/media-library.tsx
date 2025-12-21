import React, { useMemo, useState } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import CopyImage from '@/components/copy-image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/typography';
import AppLayout from '@/layouts/app-layout';
import { Image } from 'lucide-react';

type MediaItem = {
  id: string;
  url: string;
  name: string;
  size: number;
  mime: string;
  ext: string;
  uploaded_at: string;
};

type PageProps = {
  items: MediaItem[];
  usageMb: number;
  limitMb: number;
  filters: { q?: string };
  isAdmin: boolean;
};

export default function MediaLibrary() {
  const page = usePage().props as unknown as PageProps;
  const [q, setQ] = useState(page.filters?.q || '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return page.items;
    return page.items.filter((it) =>
      it.name.toLowerCase().includes(query) || it.id.toLowerCase().includes(query)
    );
  }, [q, page.items]);

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/media', { q }, { preserveState: true });
  };

  const onUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      await router.post('/media', form, {
        forceFormData: true,
        onError: (errs) => {
          const msg = (errs as any)?.file || 'Upload failed';
          setError(String(msg));
        },
        onFinish: () => setUploading(false),
      });
    } catch (err: any) {
      setError(err?.message || 'Upload failed');
      setUploading(false);
    }
  };

  const onDelete = async (id: string) => {
    setError(null);
    await router.delete(`/media/${id}`, {
      onError: (errs) => setError((errs as any)?.id || 'Delete failed'),
    });
  };

  const humanSize = (n: number) => {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <AppLayout title="Media Library" breadcrumbs={[{ title: 'Media Library', href: '#' }]}>
      <div className="flex justify-between mb-4 flex-wrap"> 
        <form onSubmit={onSearchSubmit} className="flex items-center gap-2">
          <Input placeholder="Search by name or ID" value={q} onChange={(e) => setQ(e.target.value)} />
          <Button type="submit" variant="secondary">Search</Button>
        </form>
        <p className="text-sm text-muted-foreground mt-2">Storage: {page.usageMb} MB / {page.limitMb} MB {page.isAdmin ? '(admin: unlimited)' : ''}</p>

      </div>
      <p className="text-sm text-muted-foreground mb-4">Tip: Click images to copy their URL and use them in an image block. Uploads are auto-compressed to WebP.</p>
      <div className="flex-1">

        <div className="grid md:grid-cols-4 sm:grid-cols-3 grid-cols-2 gap-4">
          {filtered.map((it) => (
            <Card key={it.id} className="p-2">
              <div className="relative group">
                <img src={it.url} alt={it.name} className="w-full h-36 object-cover rounded" />
                <CopyImage
                  copyText={it.url}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <div className="mt-2">
                <div className="text-sm font-medium truncate" title={it.name}>{it.name}</div>
                <div className="text-xs text-muted-foreground">{humanSize(it.size)} • {it.ext.toUpperCase()}</div>
                <div className="flex items-center gap-2 mt-2">
                  <a href={it.url} className="text-xs underline" target="_blank" rel="noreferrer">Open</a>
                  <Button size="sm" variant="destructive" className="ml-auto" onClick={() => onDelete(it.id)}>Delete</Button>
                </div>
              </div>
            </Card>
          ))}
          {filtered.length === 0 && q && (
            <p className="text-xl font-medium">No media found.</p>
          )}
          {!q && 
          <Card className="p-2">
            <div className="flex items-center gap-3 relative h-36 bg-foreground/5 w-full border-1 border-dashed border-muted-foreground/50 rounded-md justify-center">
              <Image className="size-6 text-muted-foreground" />
              <input type="file" accept="image/*" onChange={onUploadChange} className='absolute inset-0 opacity-0 cursor-pointer' />
            </div>
            <Button size="sm" disabled className='mt-auto'>{uploading ? 'Uploading…' : 'Upload'}</Button>
            {error && <p className="text-destructive mt-2 text-sm">{error}</p>}
          </Card>}
        </div>
      </div>
    </AppLayout>
  );
}
