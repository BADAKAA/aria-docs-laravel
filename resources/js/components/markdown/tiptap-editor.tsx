import { useEffect, useRef, useState } from 'react';
import { useCreateBlockNote, useEditorChange } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { createDocsBlockNoteSchema } from '@/blocks/blocknote-schema';

// Helper: read cookie value by name
const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
};

// Build CSRF headers for Laravel (meta tag or XSRF cookie; fallback to Sanctum)
const getCsrfHeaders = async (): Promise<Record<string, string>> => {
  const headers: Record<string, string> = { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' };
  const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
  const metaToken = meta?.content?.trim();
  if (metaToken) {
    headers['X-CSRF-TOKEN'] = metaToken;
    return headers;
  }
  let xsrf = getCookie('XSRF-TOKEN');
  if (!xsrf) {
    try {
      // Initialize XSRF cookie via Sanctum if available
      await fetch('/sanctum/csrf-cookie', { method: 'GET', credentials: 'same-origin' });
      xsrf = getCookie('XSRF-TOKEN');
    } catch {
      // ignore; we'll error below if still missing
    }
  }
  if (xsrf) {
    headers['X-XSRF-TOKEN'] = xsrf;
    return headers;
  }
  throw new Error('CSRF token not found. Please refresh and try again.');
};

export type TiptapEditorProps = {
  value: string;
  onChange: (markdown: string) => void;
  className?: string;
};

export default function TiptapEditor({ value, onChange, className }: TiptapEditorProps) {
  const schema = createDocsBlockNoteSchema();
  const editor = useCreateBlockNote({
    schema,
    // Provide an upload handler to enable the "Upload" tab in the Image dialog.
    // Replace with MediaController + User media library integration
    uploadFile: async (file) => {
      try {
        const form = new FormData();
        form.append('file', file);

        const headers = await getCsrfHeaders();

        const resp = await fetch('/media', {
          method: 'POST',
          body: form,
          headers,
          credentials: 'same-origin',
        });

        if (resp.ok) {
          const data = await resp.json();
          if (data?.url && typeof data.url === 'string') {
            return data.url as string;
          }
          const msg = 'Upload succeeded but no URL returned';
          throw new Error(msg);
        }

        // Try to read error details from JSON (Laravel validation, auth, etc.)
        let message = 'Upload failed';
        if (resp.status === 419) {
          message = 'Session expired or CSRF mismatch. Please refresh and retry.';
        }
        try {
          const errData = await resp.json();
          const fileErr = (errData?.errors?.file && Array.isArray(errData.errors.file)) ? errData.errors.file[0] : undefined;
          message = fileErr || errData?.message || `${resp.status} ${resp.statusText}`;
        } catch {
          message = `${resp.status} ${resp.statusText}`;
        }
        throw new Error(message);
      } catch (e: any) {
        const msg = e?.message ? String(e.message) : 'Upload failed';
        throw new Error(msg);
      }
    },
  });
  const lastOutputRef = useRef<string>('');
  const suppressNextEmitRef = useRef<boolean>(false);

  useEffect(() => {
    const load = async () => {
      // If parent echoed our last output back, ignore to prevent loops
      if (value === lastOutputRef.current) {
        return;
      }
      let blocks;
      try {
        const parsed = JSON.parse(value || '[]');
        blocks = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        blocks = [];
      }
      editor.replaceBlocks(editor.document, blocks);
      // Suppress emission caused by external import to avoid echo loops
      suppressNextEmitRef.current = true;
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEditorChange(async (e) => {
    // Skip the immediate change event triggered by external import
    if (suppressNextEmitRef.current) {
      suppressNextEmitRef.current = false;
      return;
    }
    const output = JSON.stringify(e.document);
    if (output !== lastOutputRef.current) {
      lastOutputRef.current = output;
      onChange(output);
    }
  }, editor);

  return (
    <Card className={cn('p-0 bg-muted', className)}>
      <BlockNoteView editor={editor} className="min-h-[300px]" style={{ fontFamily: 'inherit' }} />
    </Card>
  );
}
