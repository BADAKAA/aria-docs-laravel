import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePrism from 'rehype-prism-plus';
import rehypeCodeTitles from 'rehype-code-titles';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

// Render Markdown to HTML string using same plugins as React rendering
export async function renderMarkdownToHtml(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeCodeTitles as any)
    .use(rehypePrism as any)
    .use(rehypeSlug as any)
    .use(rehypeAutolinkHeadings as any)
    .use(rehypeStringify)
    .process(markdown);
  return String(file);
}
