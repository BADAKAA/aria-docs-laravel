import { Link } from '@inertiajs/react';
import { ComponentProps } from 'react';

export default function MarkdownLink({ href, ...props }: ComponentProps<'a'>) {
  if (!href) return null;
  const isExternal = typeof href === 'string' && /^(https?:)?\/\//.test(href);
  if (isExternal) {
    return <a href={href} {...props} target="_blank" rel="noopener noreferrer" />;
  }
  return (
    <Link href={href as any} {...(props as any)}>
      {props.children as any}
    </Link>
  );
}
