import React from 'react';
import { BlockNoteViewRaw as BlockNoteView, useCreateBlockNote } from '@blocknote/react';
import '@blocknote/mantine/style.css';
import { createDocsBlockNoteSchema } from '@/blocks/blocknote-schema';

export default function ReadOnlyBlockNote({ blocks }: { blocks: any[] }) {
  const schema = React.useMemo(() => createDocsBlockNoteSchema(), []);
  const editor = useCreateBlockNote({
    schema,
    initialContent: Array.isArray(blocks) ? blocks : [],
  });
  return <BlockNoteView editor={editor} editable={false} className='blocknote-readonly' />;
}
