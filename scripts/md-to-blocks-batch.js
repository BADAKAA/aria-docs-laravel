#!/usr/bin/env node
/**
 * Batch Markdown → BlockNote Blocks JSON converter.
 * Reads a JSON object mapping filePath -> markdownBody, outputs a JSON object mapping filePath -> blocks JSON string.
 * Usage:
 *   node scripts/md-to-blocks-batch.js <input.json>
 *   or pass nothing and pipe JSON via stdin.
 */

import fs from 'fs';
import path from 'path';
import { ServerBlockNoteEditor } from '@blocknote/server-util';

async function readInput(argvPath) {
  if (argvPath) {
    const p = path.resolve(argvPath);
    return fs.readFileSync(p, 'utf8');
  }
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

async function main() {
  const inputPath = process.argv[2];
  const raw = await readInput(inputPath);
  let map;
  try {
    map = JSON.parse(raw);
  } catch (e) {
    console.error('Invalid JSON input');
    process.exit(1);
  }
  if (!map || typeof map !== 'object') {
    console.error('Input must be an object of { filePath: markdown }');
    process.exit(1);
  }

  const editor = ServerBlockNoteEditor.create();
  const out = {};
  for (const [fp, md] of Object.entries(map)) {
    const blocks = await editor.tryParseMarkdownToBlocks(String(md || ''));
    out[fp] = JSON.stringify(blocks);
  }
  process.stdout.write(JSON.stringify(out));
}

main();
