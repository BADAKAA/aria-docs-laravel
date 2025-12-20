// Minimal renderer for BlockNote inline content to HTML strings.
// Supports text with styles and links.

type Styles = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  code?: boolean;
};

type TextNode = {
  type: 'text';
  text: string;
  styles?: Styles;
};

type LinkNode = {
  type: 'link';
  href: string;
  title?: string;
  target?: string;
  content?: InlineNode[];
};

type InlineNode = TextNode | LinkNode | any;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function applyStyles(text: string, styles?: Styles): string {
  let html = escapeHtml(text);
  if (!styles) return html;
  if (styles.code) html = `<code>${html}</code>`;
  if (styles.bold) html = `<strong>${html}</strong>`;
  if (styles.italic) html = `<em>${html}</em>`;
  if (styles.underline) html = `<u>${html}</u>`;
  if (styles.strike) html = `<s>${html}</s>`;
  return html;
}

export function inlineContentToHTML(content?: InlineNode[]): string {
  if (!Array.isArray(content)) return '';
  const parts: string[] = [];
  for (const node of content) {
    if (!node || typeof node !== 'object') continue;
    if (node.type === 'text' && typeof node.text === 'string') {
      parts.push(applyStyles(node.text, node.styles));
      continue;
    }
    if (node.type === 'link' && typeof node.href === 'string') {
      const inner = inlineContentToHTML(node.content);
      const title = typeof node.title === 'string' ? ` title="${escapeHtml(node.title)}"` : '';
      const target = typeof node.target === 'string' ? ` target="${escapeHtml(node.target)}"` : '';
      const rel = ' rel="noopener noreferrer"';
      parts.push(`<a href="${escapeHtml(node.href)}"${title}${target}${rel}>${inner}</a>`);
      continue;
    }
    // Fallback: unknown node types - attempt to use node.text
    if (typeof node.text === 'string') {
      parts.push(escapeHtml(node.text));
    }
  }
  return parts.join('');
}
