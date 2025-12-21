#!/usr/bin/env node
/**
 * Markdown → BlockNote Blocks JSON converter for seeding.
 * Uses BlockNote's ServerBlockNoteEditor to parse Markdown natively.
 * Usage: node scripts/md-to-prosemirror.js <markdown-file-path>
 */

import fs from 'fs';
import path from 'path';
import { ServerBlockNoteEditor } from '@blocknote/server-util';

function readFile(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return ''; }
}

async function main() {
  const fp = process.argv[2];
  if (!fp) { console.error('Usage: md-to-prosemirror <file.md>'); process.exit(1); }
  let md = readFile(path.resolve(fp));
  // Strip YAML frontmatter if present
  if (md.startsWith('---')) {
    const parts = md.split(/\r?\n---\r?\n/);
    if (parts.length >= 2) {
      // parts[0] starts with '---', drop it; parts[1] is YAML, remaining is content (joined in case extra --- within)
      md = parts.slice(2).join('\n---\n');
    }
  }

  // Use BlockNote server-side editor to parse Markdown into blocks
  const editor = ServerBlockNoteEditor.create();
  const blocks = await editor.tryParseMarkdownToBlocks(md);
  // Output BlockNote blocks JSON
  process.stdout.write(JSON.stringify(blocks));
}

main();
