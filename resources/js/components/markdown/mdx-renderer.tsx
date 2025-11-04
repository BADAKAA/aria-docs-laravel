import { useEffect, useMemo, useState, type ComponentType } from "react";
import { MDXProvider } from "@mdx-js/react";
import { run } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import { mdxComponents, getRehypePlugins, remarkPlugins } from "@/lib/markdown";

// Client-side MDX renderer: compiles an MDX string to a component at runtime.
// Prefer server-side precompilation when possible.
export default function MDXRenderer({ source }: { source: string }) {
  const [Mod, setMod] = useState<null | ComponentType<any>>(null);

  useEffect(() => {
    let mounted = true;
    async function compile() {
      try {
        const mod: any = await run(
          source,
          {
            // Cast as any due to MDX v3 RunOptions typing not including plugins
            remarkPlugins,
            rehypePlugins: getRehypePlugins(),
            jsx: (runtime as any).jsx,
            jsxs: (runtime as any).jsxs,
            Fragment: (runtime as any).Fragment,
            development: import.meta.env.DEV,
          } as any
        );
        if (mounted) setMod(() => mod.default);
      } catch (e) {
        console.error("MDX compile error:", e);
        if (mounted) setMod(() => null);
      }
    }
    compile();
    return () => {
      mounted = false;
    };
  }, [source]);

  const content = useMemo(() => {
    if (!Mod) return null;
    const Cmp = Mod as any;
    return (
      <MDXProvider components={mdxComponents}>
        <Cmp />
      </MDXProvider>
    );
  }, [Mod]);

  return content;
}
