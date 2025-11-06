import React, { useEffect, useMemo, useState } from 'react';
import { useMDXComponents } from '@mdx-js/react';
import type { PluggableList } from 'unified';

// We import the runtime used by MDX to create React elements at runtime
import * as runtime from 'react/jsx-runtime';
import * as devRuntime from 'react/jsx-dev-runtime';
// `evaluate` compiles and evaluates raw MDX to a React component in the browser
import { evaluate } from '@mdx-js/mdx';

type Components = any;

export type MdxLivePreviewProps = {
  value: string;
  className?: string;
  remarkPlugins?: PluggableList;
  rehypePlugins?: PluggableList;
  components?: Components;
  /** Optional render prop for errors */
  renderError?: (error: unknown) => React.ReactNode;
};

export default function MdxLivePreview({
  value,
  className,
  remarkPlugins,
  rehypePlugins,
  components,
  renderError,
}: MdxLivePreviewProps) {
  const [Content, setContent] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<unknown | null>(null);
  const useComponents = useMDXComponents(components);

  // Keep options stable between renders where possible
  const mdxOptions = useMemo(
    () => ({ remarkPlugins, rehypePlugins }),
    [remarkPlugins, rehypePlugins]
  );

  useEffect(() => {
    let cancelled = false;
    setError(null);
    // If the value is empty, clear output to avoid showing stale preview
    if (!value || !value.trim()) {
      setContent(() => () => null);
      return;
    }

    (async () => {
      try {
        const dev = (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.DEV) ?? (process.env.NODE_ENV !== 'production');
        const mod = await evaluate(value, {
          ...(mdxOptions as any),
          // Provide the React 17+ JSX runtime symbols
          Fragment: (runtime as any).Fragment,
          jsx: (runtime as any).jsx,
          jsxs: (runtime as any).jsxs,
          ...(dev ? { jsxDEV: (devRuntime as any).jsxDEV } : {}),
          // Attach MDX components resolver so "components" prop works
          useMDXComponents: () => useComponents,
          // Enable dev transforms for better error messages in dev
          development: !!dev,
        } as any);
        const MDXContent = (mod as any).default as React.ComponentType;
        if (!cancelled) setContent(() => MDXContent);
      } catch (err) {
        if (!cancelled) {
          setError(err);
          setContent(() => () => null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [value, mdxOptions]);

  if (error) {
    return (
      <div className={className}>
        {renderError ? (
          renderError(error)
        ) : (
          <pre className="text-sm text-destructive whitespace-pre-wrap">
            {String(error)}
          </pre>
        )}
      </div>
    );
  }

  if (!Content) {
    return <div className={className} />;
  }

  const C = Content as unknown as React.ComponentType<any>;
  return (
    <div className={className}>
      {/* Pass components directly; evaluate() configured useMDXComponents */}
      <C components={useComponents} />
    </div>
  );
}
