import { MDXProvider } from '@mdx-js/react';
import Pre from '../components/markdown/pre';
import Note from '../components/markdown/note';
import { Stepper, StepperItem } from '../components/markdown/stepper';
import Files from '../components/markdown/files';
import Image from '../components/markdown/image';
import type { ReactNode } from 'react';
import LinkCmp from '../components/markdown/link';
import Outlet from '../components/markdown/outlet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import remarkGfm from 'remark-gfm';
import rehypePrism from 'rehype-prism-plus';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import rehypeCodeTitles from 'rehype-code-titles';
import { visit } from 'unist-util-visit';
import { evaluate } from '@mdx-js/mdx';
import * as runtime from 'react/jsx-runtime';
import * as devRuntime from 'react/jsx-dev-runtime';

export const mdxComponents: Record<string, any> = {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Outlet,
  pre: Pre as any,
  Note: Note as any,
  Stepper: Stepper as any,
  StepperItem: StepperItem as any,
  img: Image as any,
  a: LinkCmp as any,
  Files: Files as any,
  table: Table as any,
  thead: TableHeader as any,
  th: TableHead as any,
  tr: TableRow as any,
  tbody: TableBody as any,
  t: TableCell as any,
};

export const mdxRemarkPlugins = [remarkGfm];
export const getMdxRehypePlugins = () => [
  // capture raw code for Copy button
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  () => (tree: any) => {
    visit(tree, (node: any) => {
      if (node?.type === 'element' && node?.tagName === 'pre') {
        const [codeEl] = node.children || [];
        if (!codeEl || codeEl.tagName !== 'code') return;
        node.raw = codeEl.children?.[0]?.value ?? '';
      }
    });
  },
  rehypeCodeTitles,
  rehypePrism,
  rehypeSlug,
  rehypeAutolinkHeadings,
  // expose raw on <pre>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  () => (tree: any) => {
    visit(tree, 'element', (node: any) => {
      if (node?.type === 'element' && node?.tagName === 'pre') {
        node.properties = node.properties || {};
        node.properties['raw'] = node.raw;
      }
    });
  },
];

// A lighter set of rehype plugins for client-side runtime rendering.
// Excludes rehype-prism-plus to avoid pulling in large Prism highlight bundle at view time.
export const getMdxRehypePluginsLite = () => [
  // capture raw code for Copy button
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  () => (tree: any) => {
    visit(tree, (node: any) => {
      if (node?.type === 'element' && node?.tagName === 'pre') {
        const [codeEl] = node.children || [];
        if (!codeEl || codeEl.tagName !== 'code') return;
        node.raw = codeEl.children?.[0]?.value ?? '';
      }
    });
  },
  rehypeCodeTitles,
  // Intentionally omit rehypePrism here
  rehypeSlug,
  rehypeAutolinkHeadings,
  // expose raw on <pre>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  () => (tree: any) => {
    visit(tree, 'element', (node: any) => {
      if (node?.type === 'element' && node?.tagName === 'pre') {
        node.properties = node.properties || {};
        node.properties['raw'] = node.raw;
      }
    });
  },
];

export function MDXProviderWrapper({ children }: { children: ReactNode }) {
  return <MDXProvider components={mdxComponents}>{children}</MDXProvider>;
}

// Render MDX string to HTML string in the browser by evaluating to a React Component and server-rendering it
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
  // Render to string without bringing in a full SSR runtime by using jsx-runtime to build an element tree
  // Consumers can choose to send this to the server as HTML for storage
  const el = (runtime as any).jsx(MDXContent, { components: mdxComponents });
  // Lazy import react-dom/server only in the browser when needed via dynamic import to avoid bundling in main path
  const { renderToString } = await import('react-dom/server');
  return renderToString(el);
}

// Keep named exports only for compatibility with TS bundler resolution
