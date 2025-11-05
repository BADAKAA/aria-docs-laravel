import remarkGfm from "remark-gfm";
import rehypePrism from "rehype-prism-plus";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import rehypeCodeTitles from "rehype-code-titles";
import { visit } from "unist-util-visit";
import Pre from "../components/markdown/pre";
import { getIconName, hasSupportedExtension } from "./utils";
import type { Components } from "react-markdown";

// Preprocess: capture raw code string for Copy button
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const preProcess = () => (tree: any) => {
  visit(tree, (node: any) => {
    if (node?.type === "element" && node?.tagName === "pre") {
      const [codeEl] = node.children || [];
      if (!codeEl || codeEl.tagName !== "code") return;
      node.raw = codeEl.children?.[0]?.value ?? "";
    }
  });
};

// Postprocess: expose `raw` as property for our <Pre raw="..." />
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const postProcess = () => (tree: any) => {
  visit(tree, "element", (node: any) => {
    if (node?.type === "element" && node?.tagName === "pre") {
      node.properties = node.properties || {};
      node.properties["raw"] = node.raw;
    }
  });
};

// Enhance code titles by inserting a language/file icon like in Next version
function rehypeCodeTitlesWithLogo() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (tree: any) => {
    visit(tree, "element", (node: any) => {
      if (
        node?.tagName === "div" &&
        node?.properties?.className?.includes("rehype-code-title")
      ) {
        const titleTextNode = node.children.find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (child: any) => child.type === "text"
        );
        if (!titleTextNode) return;

        const titleText = titleTextNode.value as string;
        const match = hasSupportedExtension(titleText);
        if (!match) return;

        const splittedNames = titleText.split(".");
        const ext = splittedNames[splittedNames.length - 1];
        const iconClass = `devicon-${getIconName(ext)}-plain text-[17px]`;

        node.children.unshift({
          type: "element",
          tagName: "i",
          properties: { className: [iconClass, "code-icon"] },
          children: [],
        });
      }
    });
  };
}

// ReactMarkdown components mapping
export const rmComponents: Components = {
  // Ensure our custom Pre wrapper receives the raw prop from postProcess
  pre: ({ node, children, ...props }) => (
    <Pre raw={(node as any)?.properties?.raw as string} {...(props as any)}>
      {children}
    </Pre>
  ),
  // Safe default anchor: open in new tab
  a: ({ node, ...props }) => (
    <a {...props} target="_blank" rel="noopener noreferrer" />
  ),
  // Use native img to avoid Next dependency in Laravel app
  img: ({ node, ...props }) => <img {...props} />,
  // Pass through table elements so Tailwind prose styles apply
  table: ({ node, ...props }) => <table {...props} />,
  thead: ({ node, ...props }) => <thead {...props} />,
  tbody: ({ node, ...props }) => <tbody {...props} />,
  tr: ({ node, ...props }) => <tr {...props} />,
  th: ({ node, ...props }) => <th {...props} />,
  td: ({ node, ...props }) => <td {...props} />,
};

export const rmRemarkPlugins = [remarkGfm];
export const rmRehypePlugins = [
  preProcess,
  rehypeCodeTitles,
  rehypeCodeTitlesWithLogo,
  rehypePrism,
  rehypeSlug,
  rehypeAutolinkHeadings,
  postProcess,
];

export type { Components as ReactMarkdownComponents };

// ----- TOC helpers -----
export type TocItem = { level: number; text: string; href: string };

function sluggify(text: string) {
  const slug = text.toLowerCase().replace(/\s+/g, "-");
  return slug.replace(/[^a-z0-9-]/g, "");
}

export function extractTocFromMarkdown(rawMd: string): TocItem[] {
  const headingsRegex = /^(#{2,4})\s(.+)$/gm;
  const items: TocItem[] = [];
  let match: RegExpExecArray | null;
  while ((match = headingsRegex.exec(rawMd)) !== null) {
    const level = match[1].length; // number of #
    const text = match[2].trim();
    const slug = sluggify(text);
    items.push({ level, text, href: `#${slug}` });
  }
  return items;
}
