import { useEffect, useRef, useState } from "react";
import { X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type SearchItem = {
  id: number;
  title: string;
  summary?: string | null;
  url: string;
  type: 'blog' | 'docs';
};

export default function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<SearchItem[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
        setTimeout(() => inputRef.current?.focus(), 50);
        return;
    };
    setQuery("");
    setItems([]);
    setActive(0);
  }, [open]);

  // Debounce fetch
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const id = setTimeout(async () => {
      const q = query.trim();
      if (!q) {
        setItems([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        const data = await res.json();
        setItems((data?.data ?? []) as SearchItem[]);
      } catch (e) {
        if ((e as any).name !== 'AbortError') console.error(e);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [query, open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') setActive((a) => Math.min(a + 1, Math.max(0, items.length - 1)));
      if (e.key === 'ArrowUp') setActive((a) => Math.max(0, a - 1));
      if (e.key === 'Enter') {
        const item = items[active];
        if (item) window.location.href = item.url;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [items, active, open, onClose]);

  if (!open) return null;

  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const highlight = (text: string, q: string) => {
    const queryText = q.trim();
    if (!queryText) return text;
    try {
      const re = new RegExp(`(${escapeRegExp(queryText)})`, 'ig');
      const parts = text.split(re);
      return parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="bg-yellow-200/60 dark:bg-yellow-500/30 rounded">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      );
    } catch {
      return text;
    }
  };

  const buildSnippet = (text: string, q: string, context = 70) => {
    const queryText = q.trim();
    if (!queryText) return text;
    const lower = text.toLowerCase();
    const idx = lower.indexOf(queryText.toLowerCase());
    if (idx === -1) return text;
    let start = Math.max(0, idx - context);
    let end = Math.min(text.length, idx + queryText.length + context);
    // try to avoid cutting words in half
    if (start > 0) {
      const nextSpace = text.indexOf(' ', start);
      if (nextSpace !== -1 && nextSpace < idx) start = nextSpace + 1;
    }
    if (end < text.length) {
      const prevSpace = text.lastIndexOf(' ', end);
      if (prevSpace !== -1 && prevSpace > idx + queryText.length) end = prevSpace;
    }
    const prefix = start > 0 ? '…' : '';
    const suffix = end < text.length ? '…' : '';
    return `${prefix}${text.slice(start, end).trim()}${suffix}`;
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 p-4"
      onClick={() => onClose()}
    >
      <div
        className="w-full max-w-2xl rounded-lg bg-background border shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cn('flex items-center gap-2 px-3 py-2',query ? 'border-b':'')}>
          <Search className="size-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title or summary"
            className="flex-1 bg-transparent outline-none text-sm py-2"
          />
          <button onClick={onClose} className="rounded-md cursor-pointer px-2 py-2 text-sm hover:bg-muted">
            <X className="size-4" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="px-4 py-3 text-sm text-muted-foreground">Searching…</div>
          )}
          {!loading && items.length === 0 && query && (
            <div className="px-4 py-3 text-sm text-muted-foreground">No results</div>
          )}
          <ul>
            {items.map((it, i) => (
              <li key={`${it.type}-${it.id}`}>
                <a
                  href={it.url}
                  className={cn(
                    "block px-4 py-3 hover:bg-muted/60",
                    i === active ? "bg-muted/60" : undefined
                  )}
                >
                  <div className="text-sm font-medium flex items-center gap-2">
                    <span className="rounded border px-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {it.type}
                    </span>
                    <span>{highlight(it.title, query)}</span>
                  </div>
                  {it.summary && (
                    <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{highlight(buildSnippet(it.summary, query), query)}</div>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
