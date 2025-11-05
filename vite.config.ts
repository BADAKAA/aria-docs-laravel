import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';
import mdx from '@mdx-js/rollup';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import rehypePrism from 'rehype-prism-plus';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import rehypeCodeTitles from 'rehype-code-titles';
import { visit } from 'unist-util-visit';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        mdx({
            // Ensure MDX uses the React provider so components mapping works
            providerImportSource: '@mdx-js/react',
            remarkPlugins: [
                remarkGfm,
                remarkFrontmatter,
                // export frontmatter as `export const frontmatter = {}`
                [remarkMdxFrontmatter, { name: 'frontmatter' }],
            ],
            rehypePlugins: [
                // Pre-process to capture raw code for copy button
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
                // Augment code titles with a devicon-like icon class when file extension is known
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                () => (tree: any) => {
                    const fileExtensionIconMap: Record<string, string> = {
                        js: 'javascript',
                        ts: 'typescript',
                        jsx: 'react',
                        tsx: 'react',
                        java: 'java',
                        css: 'css3',
                        md: 'markdown',
                        mdx: 'markdown',
                        go: 'go',
                        astro: 'astro',
                        prisma: 'prisma',
                        py: 'python',
                        kt: 'kotlin',
                        php: 'php',
                        gitignore: 'git',
                        cs: 'csharp',
                        cpp: 'cplusplus',
                        c: 'c',
                        bash: 'bash',
                        html: 'html5',
                    };
                    visit(tree, 'element', (node: any) => {
                        if (
                            node?.tagName === 'div' &&
                            node?.properties?.className?.includes('rehype-code-title')
                        ) {
                            const titleTextNode = node.children.find((child: any) => child.type === 'text');
                            if (!titleTextNode) return;
                            const titleText = String(titleTextNode.value || '');
                            const parts = titleText.split('.');
                            const ext = parts[parts.length - 1];
                            const icon = fileExtensionIconMap[ext];
                            if (!icon) return;
                            const iconClass = `devicon-${icon}-plain text-[17px]`;
                            node.children.unshift({
                                type: 'element',
                                tagName: 'i',
                                properties: { className: [iconClass, 'code-icon'] },
                                children: [],
                            });
                        }
                    });
                },
                rehypePrism,
                rehypeSlug,
                rehypeAutolinkHeadings,
                // Post-process to expose raw as property on <pre>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                () => (tree: any) => {
                    visit(tree, 'element', (node: any) => {
                        if (node?.type === 'element' && node?.tagName === 'pre') {
                            node.properties = node.properties || {};
                            node.properties['raw'] = node.raw;
                        }
                    });
                },
            ],
        }),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
    ],
    esbuild: {
        jsx: 'automatic',
    },
});
