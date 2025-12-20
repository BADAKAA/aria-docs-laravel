import React from 'react';
import {
  Block,
  trustedBlockMap,
  untrustedBlockMap,
  TrustedBlockType,
  UntrustedBlockType,
} from '@/blocks/registry';

export default function BlockRenderer({ block }: { block: Block }) {
  const { type, props = {} } = block;

  if (type in trustedBlockMap) {
    const Component = trustedBlockMap[type as TrustedBlockType];
    return <Component {...props} content={(block as any).content} items={(block as any).items} />;
  }

  if (type in untrustedBlockMap) {
    const Component = untrustedBlockMap[type as UntrustedBlockType];
    return <Component {...props} content={(block as any).content} items={(block as any).items} />;
  }

  // Fallback: unknown type -> try paragraph
  const Paragraph = untrustedBlockMap['paragraph'] as React.ComponentType<any> | undefined;
  return Paragraph ? <Paragraph content={(block as any).content} /> : null;
}
