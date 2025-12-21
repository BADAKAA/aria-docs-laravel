import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, CopyCheck } from 'lucide-react';
import { cn, copyToClipboard } from '@/lib/utils';


type CopyImageProps = {
  copyText: string;
  className?: string;
  duration?: number; // ms to show success state
};

export default function CopyImage({ copyText, className, duration = 1500 }: CopyImageProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = async () => {
    setError(null);
    try {
    await copyToClipboard(copyText);
      setCopied(true);
    } catch (e) {
      setError('Failed to copy URL');
    }
    setTimeout(() => {setError(null); setCopied(false);}, duration);
  };

  return (
    <div className={cn('absolute inset-0 flex items-center justify-center', className)}>
      <Button
        variant="ghost"
        aria-label={copied ? 'Copied image URL' : 'Copy image URL'}
        title={copied ? 'Copied!' : 'Copy image URL'}
        onClick={onClick}
        className={cn('w-full h-full flex items-center justify-center bg-black/0 hover:bg-black/25 rounded transition-colors')}
      >
        {copied ? <CopyCheck className="size-5 text-white" /> : <Copy className="size-5 text-white" />}
      </Button>
      {error && (
        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-destructive bg-background/80 px-1 rounded">
          {error}
        </span>
      )}
    </div>
  );
}
