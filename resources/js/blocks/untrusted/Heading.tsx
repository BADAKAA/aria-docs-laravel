import React, { useEffect, useRef } from 'react';
import { setSanitizedHTML } from '@/utils/sanitize';
import { inlineContentToHTML } from '@/utils/blocknote';

export type HeadingProps = {
  content?: any[];
  level?: number; // 1..6
};

export default function Heading({ content, level = 2 }: HeadingProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const inner = inlineContentToHTML(content);
    const tag = Math.min(6, Math.max(1, Number(level || 2)));
    const result = inner ? `<h${tag}>${inner}</h${tag}>` : '';
    setSanitizedHTML(ref.current, result);
  }, [content, level]);

  return <div ref={ref} className="heading" />;
}
