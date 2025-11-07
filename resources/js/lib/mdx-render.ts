import { evaluate } from '@mdx-js/mdx';
import * as runtime from 'react/jsx-runtime';
import * as devRuntime from 'react/jsx-dev-runtime';
import { mdxComponents, mdxRemarkPlugins, getMdxRehypePlugins } from './mdx';

export async function renderMdxToHtml(source: string): Promise<string> {
  const dev =
    (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.DEV) ??
    process.env.NODE_ENV !== 'production';
  const mod = await evaluate(source, {
    remarkPlugins: mdxRemarkPlugins as any,
    rehypePlugins: getMdxRehypePlugins() as any,
    Fragment: (runtime as any).Fragment,
    jsx: (runtime as any).jsx,
    jsxs: (runtime as any).jsxs,
    ...(dev ? { jsxDEV: (devRuntime as any).jsxDEV } : {}),
    useMDXComponents: () => mdxComponents,
    development: !!dev,
  } as any);
  const MDXContent = (mod as any).default as any;
  const el = (runtime as any).jsx(MDXContent, { components: mdxComponents });
  const { renderToString } = await import('react-dom/server');
  return renderToString(el);
}
