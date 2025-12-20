import React, { useEffect, useRef } from 'react';
import { setSanitizedHTML } from '@/utils/sanitize';
import { inlineContentToHTML } from '@/utils/blocknote';

export type ListProps = {
  items?: any[]; // Array of inline content arrays or strings
  ordered?: boolean;
};

export default function List({ items, ordered = false }: ListProps) {
  const ref = useRef<HTMLUListElement | HTMLOListElement | null>(null);

  useEffect(() => {
    let lis = '';
    if (Array.isArray(items)) {
      lis = items
        .map((it) => {
          if (typeof it === 'string') return `<li>${it}</li>`;
          if (Array.isArray(it)) return `<li>${inlineContentToHTML(it)}</li>`;
          if (it && Array.isArray((it as any).content)) return `<li>${inlineContentToHTML((it as any).content)}</li>`;
          return '<li></li>';
        })
        .join('');
    }
    setSanitizedHTML(ref.current, lis);
  }, [items]);

    return ordered ? <ol ref={ref as React.RefObject<HTMLOListElement>} /> : <ul ref={ref as React.RefObject<HTMLUListElement>} />;
}
