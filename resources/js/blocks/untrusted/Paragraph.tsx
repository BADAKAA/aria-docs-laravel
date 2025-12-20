import React, { useEffect, useRef } from 'react';
import { setSanitizedHTML } from '@/utils/sanitize';
import { inlineContentToHTML } from '@/utils/blocknote';

export type ParagraphProps = {
  content?: any[]; // BlockNote inline content array
};

export default function Paragraph({ content }: ParagraphProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const result = inlineContentToHTML(content);
    setSanitizedHTML(ref.current, result);
  }, [content]);

  return <div ref={ref} className="paragraph" />;
}
