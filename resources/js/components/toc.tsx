import type { TocItem } from "@/lib/markdown-react";

export default function Toc({ items }: { items: TocItem[] }) {
  if (!items?.length) return null;
  return (
    <aside className="hidden xl:block flex-[1.5] sticky top-20 max-h-[80vh] overflow-auto pl-2">
      <div className="text-sm text-muted-foreground mb-2">On this page</div>
      <ul className="text-sm space-y-1">
        {items.map((h) => (
          <li key={h.href} className={h.level === 2 ? "pl-0" : h.level === 3 ? "pl-3" : "pl-6"}>
            <a href={h.href} className="text-foreground/80 hover:text-foreground">
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
