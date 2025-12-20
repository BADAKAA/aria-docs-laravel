import { useEffect, useRef } from 'react';
import { useCreateBlockNote, useEditorChange } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type TiptapEditorProps = {
  value: string;
  onChange: (markdown: string) => void;
  className?: string;
};

export default function TiptapEditor({ value, onChange, className }: TiptapEditorProps) {
  const editor = useCreateBlockNote();
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
