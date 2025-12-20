import React from 'react';
import ReactMarkdown from 'react-markdown';
import { rmComponents, rmRemarkPlugins, rmRehypePlugins } from '@/lib/markdown-react';

export default function MarkdownLivePreview({ value }: { value: string }) {
  return (
    <ReactMarkdown
      components={rmComponents as any}
      remarkPlugins={rmRemarkPlugins as any}
      rehypePlugins={rmRehypePlugins as any}
    >
      {value || ''}
    </ReactMarkdown>
  );
}
