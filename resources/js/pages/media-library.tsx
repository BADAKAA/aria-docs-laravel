import React, { useMemo, useState } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import CopyImage from '@/components/copy-image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/typography';
import AppLayout from '@/layouts/app-layout';
import { Image, Loader, Pencil, Check, X } from 'lucide-react';

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState<string>('');

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

  const startEdit = (id: string, current: string) => {
    setEditingId(id);
    setNewName(current);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewName('');
  };

  const saveEdit = async (id: string) => {
    const name = newName.trim();
    if (!name) {
      setError('Name cannot be empty');
      return;
    }
    setError(null);
    await router.patch(`/media/${id}`, { name }, {
      preserveScroll: true,
      onError: (errs) => setError((errs as any)?.name || 'Rename failed'),
      onSuccess: () => {
        setEditingId(null);
        setNewName('');
      },
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
      <div className="flex-1">

        <div className="grid md:grid-cols-4 sm:grid-cols-3 grid-cols-2 gap-2 md:gap-4">
          {filtered.map((it) => (
            <Card key={it.id} className="p-2 !gap-2">
              <div className="relative group">
                <img src={it.url} alt={it.name} className="w-full h-36 object-cover rounded-md" />
                <CopyImage
                  copyText={it.url}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <div>
                {editingId === it.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="h-8"
                    />
                    <Button size="sm" variant="secondary" onClick={() => saveEdit(it.id)} aria-label="Save name">
                      <Check className="size-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit} aria-label="Cancel rename">
                      <X className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium truncate" title={it.name}>{it.name}</div>
                    <Button size="sm" variant="ghost" onClick={() => startEdit(it.id, it.name)} aria-label="Rename image">
                      <Pencil className="size-4" />
                    </Button>
                  </div>
                )}
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
              {uploading ? <Loader className="size-6 text-muted-foreground animate-spin" /> :
              <Image className="size-6 text-muted-foreground" />
              }
              <input type="file" accept="image/*" onChange={onUploadChange} className='absolute inset-0 opacity-0 cursor-pointer' />
            </div>
            <Button size="sm" disabled className='mt-auto'>{uploading ? 'Uploading…' : 'Upload'}</Button>
            {error && <p className="text-destructive mt-2 text-sm">{error}</p>}
          </Card>}
        </div>
      </div>
      <p className="text-sm text-muted-foreground my-4">Tip: Click images to copy their URL and use them in an image block. Uploads are auto-compressed to WebP.</p>

    </AppLayout>
  );
}
