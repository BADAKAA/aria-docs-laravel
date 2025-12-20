import React from 'react';

export type VideoProps = {
  src: string; // e.g., full embed URL
  title?: string;
  width?: number | string;
  height?: number | string;
};

export default function Video({ src, title, width = '100%', height = 360 }: VideoProps) {
  return (
    <div className="video-block">
      <iframe
        src={src}
        title={title || 'Video'}
        width={width}
        height={height}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture;"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
