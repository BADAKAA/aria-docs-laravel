import { MDXProvider } from '@mdx-js/react';
import Pre from '../components/markdown/pre';
import Note from '../components/markdown/note';
import { Stepper, StepperItem } from '../components/markdown/stepper';
import Files from '../components/markdown/files';
import Image from '../components/markdown/image';
import type { ComponentType, ReactNode } from 'react';
import LinkCmp from '../components/markdown/link';
import Outlet from '../components/markdown/outlet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { page_routes } from './routes-config';
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

// Re-export a shared MDX components map for both SSR and any client fallbacks
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

// Plugins used in MDX compilation (for client runtime renderer)
export const remarkPlugins = [remarkGfm];
export const getRehypePlugins = () => [
  // Preprocess: capture raw code string for Copy button
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
  // Post-process: expose `raw` as property on <pre>
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

// Content loaders using Vite import.meta.glob for MDX
type Frontmatter = { title?: string; description?: string; [k: string]: any };

// Eager server-side modules for docs (nested folders with index.mdx)
const docsModules = (import.meta as any).glob('../../contents/docs/**/index.mdx', {
  eager: true,
});

// Flat blog mdx files
const blogModules = (import.meta as any).glob('../../contents/blogs/*.mdx', {
  eager: true,
});

export type LoadedDoc = {
  slug: string; // e.g., getting-started/introduction
  Component: ComponentType<any>;
  frontmatter: Frontmatter;
};

export function loadAllDocs(): LoadedDoc[] {
  const list: LoadedDoc[] = [];
  for (const [path, mod] of Object.entries(docsModules)) {
    // path example: ../../contents/docs/getting-started/introduction/index.mdx
    const parts = path.replace(/\\/g, '/').split('/contents/docs/')[1];
    const slug = parts.replace(/\/index\.mdx$/, '');
    const Component = (mod as any).default as any;
    const frontmatter = (mod as any).frontmatter || {};
    list.push({ slug, Component, frontmatter });
  }
  return list.sort((a, b) => a.slug.localeCompare(b.slug));
}

export type LoadedBlog = {
  slug: string; // e.g., file-rec
  Component: ComponentType<any>;
  frontmatter: Frontmatter;
};

export function loadAllBlogs(): LoadedBlog[] {
  const list: LoadedBlog[] = [];
  for (const [path, mod] of Object.entries(blogModules)) {
    // path example: ../../contents/blogs/file-rec.mdx
    const file = path.replace(/\\/g, '/').split('/').pop() || '';
    const slug = file.replace(/\.mdx$/, '');
    const Component = (mod as any).default as any;
    const frontmatter = (mod as any).frontmatter || {};
    list.push({ slug, Component, frontmatter });
  }
  return list.sort((a, b) => a.slug.localeCompare(b.slug));
}

export function MDXProviderWrapper({ children }: { children: ReactNode }) {
  return <MDXProvider components={mdxComponents}>{children}</MDXProvider>;
}

// Types shared by helpers
export type BaseMdxFrontmatter = {
  title: string;
  description: string;
};

// Client-safe child discovery using the globbed MDX module list
export function getAllChilds(pathString: string) {
  const docs = loadAllDocs();
  // Normalize provided path (remove leading/trailing slashes)
  // Trim slashes and an optional 'docs/' prefix so callers can pass '/docs/..' or '/..'
  let normalized = pathString.replace(/^\/+|\/+$/g, '');
  normalized = normalized.replace(/^(?:docs\/)+/, '');
  const baseDepth = normalized.split('/').filter(Boolean).length;
  const children = docs.filter((d) => {
    const slug = d.slug.replace(/^\/+|\/+$/g, '');
    if (!slug.startsWith(normalized + '/')) return false;
    const depth = slug.split('/').filter(Boolean).length;
    return depth === baseDepth + 1;
  });
  return children.map((d) => ({
    title: d.frontmatter?.title ?? d.slug.split('/').pop() ?? 'Untitled',
    description: d.frontmatter?.description ?? '',
    href: `/docs/${d.slug}`,
  })) as (BaseMdxFrontmatter & { href: string })[];
}

// Previous/Next utilities mirroring the Next app
export function getPreviousNext(path: string) {
  // normalize to match page_routes hrefs (no leading '/docs')
  let normalized = path.replace(/^\/+|\/+$/g, '');
  normalized = normalized.replace(/^(?:docs\/)+/, '');
  const index = page_routes.findIndex(({ href }) => href === `/${normalized}`);
  return {
    prev: index > 0 ? page_routes[index - 1] : undefined,
    next: index >= 0 && index < page_routes.length - 1 ? page_routes[index + 1] : undefined,
  };
}
