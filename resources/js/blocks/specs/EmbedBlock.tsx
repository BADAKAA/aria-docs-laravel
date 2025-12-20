import React from 'react';
import { createReactBlockSpec, ReactCustomBlockRenderProps } from '@blocknote/react';
import type { PropSchema } from '@blocknote/core';
import Embed from '@/blocks/trusted/Embed';

// Define the prop schema for the Embed block
const embedPropSchema: PropSchema = {
  src: { default: undefined, type: 'string' },
  title: { default: undefined, type: 'string' },
  sandbox: { default: undefined, type: 'string' },
  width: { default: '100%' },
  height: { default: 360 },
};

// Block config for Embed: no inline content, only props
const embedConfig = {
  type: 'embed',
  propSchema: embedPropSchema,
  content: 'none' as const,
};

// Render function mapping BlockNote props to our trusted Embed component
const EmbedBlockRender = (
  props: ReactCustomBlockRenderProps<
    typeof embedConfig.type,
    typeof embedConfig.propSchema,
    typeof embedConfig.content
  >,
) => {
  const { src, title, sandbox, width, height } = props.block.props;
  return (
    <Embed src={src || ''} title={title} sandbox={sandbox} width={width} height={height} />
  );
};

// Create the React block spec for Embed
export const ReactEmbedBlock = createReactBlockSpec(embedConfig, {
  render: EmbedBlockRender,
});
