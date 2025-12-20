import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Bold, Italic, Code, Quote, List, ListOrdered, Heading2, Heading3, Undo2, Redo2, Heading1, Type, TextIcon } from 'lucide-react';

export type TiptapEditorProps = {
  value: string;
  onChange: (markdown: string) => void;
  className?: string;
};


export default function TiptapEditor({ value, onChange, className }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown.configure({
        // Input and output in Markdown
        transformPastedText: true,
      }) as any,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const md = (editor.storage as any).markdown.getMarkdown();
      onChange(md);
    },
  });

  return (
    <Card className={cn('p-0 bg-muted', className)}>
      <div className="flex flex-wrap items-center gap-2 p-2 border-b bg-muted/60">
        <div className="flex items-center gap-1 rounded-md border bg-background">
          <Button
            type="button"
            size="sm"
            variant={editor?.isActive('bold') ? 'default' : 'ghost'}
            title="Bold"
            onClick={() => editor?.chain().focus().toggleBold().run()}
            disabled={!editor}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={editor?.isActive('italic') ? 'default' : 'ghost'}
            title="Italic"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            disabled={!editor}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={editor?.isActive('codeBlock') ? 'default' : 'ghost'}
            title="Code block"
            onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
            disabled={!editor}
          >
            <Code className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={editor?.isActive('blockquote') ? 'default' : 'ghost'}
            title="Quote"
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            disabled={!editor}
          >
            <Quote className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1 rounded-md border bg-background">
          <Button
            type="button"
            size="sm"
            variant={editor?.isActive('bulletList') ? 'default' : 'ghost'}
            title="Bulleted list"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            disabled={!editor}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={editor?.isActive('orderedList') ? 'default' : 'ghost'}
            title="Ordered list"
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            disabled={!editor}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1 rounded-md border bg-background">
        <Button
            type="button"
            size="sm"
            variant={editor?.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
            title="Heading 1"
            onClick={() => editor?.chain().focus().setHeading({ level: 1 }).run()}
            disabled={!editor}
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={editor?.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
            title="Heading 2"
            onClick={() => editor?.chain().focus().setHeading({ level: 2 }).run()}
            disabled={!editor}
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={editor?.isActive('heading', { level: 3 }) ? 'default' : 'ghost'}
            title="Heading 3"
            onClick={() => editor?.chain().focus().setHeading({ level: 3 }).run()}
            disabled={!editor}
          >
            <Heading3 className="h-4 w-4" />
          </Button>
                    <Button
            type="button"
            size="sm"
            variant={editor?.isActive('paragraph') ? 'default' : 'ghost'}
            title="Paragraph"
            onClick={() => editor?.chain().focus().setParagraph().run()}
            disabled={!editor}
          >
            <TextIcon className="h-4 w-4" />
          </Button>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button type="button" size="sm" variant="ghost" title="Undo" onClick={() => editor?.chain().focus().undo().run()} disabled={!editor}>
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="ghost" title="Redo" onClick={() => editor?.chain().focus().redo().run()} disabled={!editor}>
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <EditorContent editor={editor} className="prose !max-w-none  dark:prose-invert min-h-[300px]" />
    </Card>
  );
}
