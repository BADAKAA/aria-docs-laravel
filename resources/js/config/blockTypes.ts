// Dynamic block type unions and trust classification derived from registry
import type { BlockType, TrustedBlockType, UntrustedBlockType } from '@/blocks/registry';
import { isTrustedBlock as _isTrustedBlock } from '@/blocks/registry';

export type { BlockType, TrustedBlockType, UntrustedBlockType };
export const isTrustedBlock = (type: string): boolean => _isTrustedBlock(type);