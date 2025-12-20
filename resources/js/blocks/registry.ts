import type React from 'react';

// 1) Auto-import all trusted blocks
const trustedModules = import.meta.glob(
  './trusted/*.tsx',
  { eager: true, import: 'default' }
) as Record<string, React.ComponentType<any>>;

// 2) Auto-import all untrusted blocks
const untrustedModules = import.meta.glob(
  './untrusted/*.tsx',
  { eager: true, import: 'default' }
) as Record<string, React.ComponentType<any>>;

function filePathToType(path: string): string {
  const fileName = path.split('/').pop()!; // e.g., "Video.tsx"
  const baseName = fileName.replace(/\.(t|j)sx?$/, '');
  return baseName
    .replace(/Block$/, '')
    .replace(/Display$/, '')
    .toLowerCase();
}

export const trustedBlockMap: Record<string, React.ComponentType<any>> = {};
export const untrustedBlockMap: Record<string, React.ComponentType<any>> = {};

Object.entries(trustedModules).forEach(([path, mod]) => {
  const type = filePathToType(path);
  trustedBlockMap[type] = mod;
});

Object.entries(untrustedModules).forEach(([path, mod]) => {
  const type = filePathToType(path);
  untrustedBlockMap[type] = mod;
});

// Type unions inferred from discovered files
export type TrustedBlockType = keyof typeof trustedBlockMap;
export type UntrustedBlockType = keyof typeof untrustedBlockMap;
export type BlockType = TrustedBlockType | UntrustedBlockType;

export type Block = {
  type: BlockType | string;
  props?: any;
};

export const isTrustedBlock = (type: string): boolean => type in trustedBlockMap;
