import React from 'react';

export type EmbedProps = {
  src: string;
  title?: string;
  sandbox?: string; // e.g. 'allow-scripts allow-same-origin'
  width?: number | string;
  height?: number | string;
};

export default function Embed({ src, title, sandbox, width = '100%', height = 360 }: EmbedProps) {
  return (
    <div className="embed-block">
      <iframe
        src={src}
        title={title || 'Embed'}
        width={width}
        height={height}
        sandbox={sandbox}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
