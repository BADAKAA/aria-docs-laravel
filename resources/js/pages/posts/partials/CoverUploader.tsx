import { useEffect, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Props = {
    postId: number | string;
    title: string;
    initialPreview?: string | null;
};

export default function CoverUploader({ postId, title, initialPreview = null }: Props) {
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(initialPreview);

    const {
        data,
        setData,
        post,
        delete: destroy,
        processing,
        errors,
    } = useForm<{ cover: File | null }>({ cover: null });

    useEffect(() => {
        setCoverPreview(initialPreview ?? null);
    }, [initialPreview]);

    const onCoverChange = (file: File | null) => {
        setCoverFile(file);
        setData('cover', file);
        if (file) {
            const url = URL.createObjectURL(file);
            setCoverPreview(url);
        } else {
            setCoverPreview(initialPreview ?? null);
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
        post(`/posts/${postId}/cover`, { forceFormData: true, onFinish: () => setCoverFile(null) } as any);
    };

    const deleteCover = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        destroy(`/posts/${postId}/cover`, { onSuccess: () => setCoverPreview(null) } as any);
    };

    return (
        <div>
            <Label>Cover</Label>
            <div className="relative">
                <div
                    className="border rounded bg-muted/40 hover:bg-muted/60 transition-colors cursor-pointer"
                    onDrop={onCoverDrop}
                    onDragOver={onCoverDragOver}
                    onClick={() => document.getElementById('cover-input')?.click()}
                >
                    {coverPreview ? (
                        <img src={coverPreview} alt={title} className="w-full rounded border" />
                    ) : (
                        <div className="text-sm text-muted-foreground text-center py-8">
                            Drag & drop an image here, or click to select
                        </div>
                    )}
                </div>
                <Input
                    id="cover-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onCoverChange(e.target.files?.[0] || null)}
                />
                {errors.cover && <p className="text-xs text-destructive mt-1">{errors.cover}</p>}
                <div className="flex w-full items-center gap-2 absolute bottom-2 px-2 left-0">
                    <Button type="button" variant="secondary" className='grow' disabled={!coverFile || processing} onClick={submitCover}>
                        Save
                    </Button>
                    <Button type="button" variant="secondary" className='grow' onClick={deleteCover} disabled={!coverPreview || processing}>
                        Delete
                    </Button>
                </div>
            </div>
        </div>
    );
}
