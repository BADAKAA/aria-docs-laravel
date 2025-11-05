import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';

type IndexItem = {
  id: number;
  title: string;
  slug: string; // expects "category/slug"
  category?: string | null;
  parent_id: number | null;
};

function buildTree(items: IndexItem[]) {
  const byParent = new Map<number | null, IndexItem[]>();
  items.forEach((it) => {
    const key = it.parent_id;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(it);
  });
  // sort siblings alphabetically by title
  for (const list of byParent.values()) {
    list.sort((a, b) => a.title.localeCompare(b.title));
  }
  return {
    childrenOf: (parentId: number | null) => byParent.get(parentId) ?? [],
  };
}

function getCategory(item: IndexItem): string {
  const fromField = (item.category ?? '').trim();
  if (fromField) return fromField;
  const firstSegment = (item.slug || '').split('/')[0] || '';
  return firstSegment || 'General';
}

export default function DocsMenu() {
  const page: any = usePage();
  const items = (page.props.index ?? []) as IndexItem[];
  const current = (page.props.post?.slug ?? '') as string;

  const { childrenOf } = useMemo(() => buildTree(items), [items]);
  const roots = useMemo(() => childrenOf(null), [childrenOf]);

  // Track open state for first-level items (so their children — second level — are collapsible)
  const [openParents, setOpenParents] = useState<Set<number>>(
    () => new Set(roots.map((r) => r.id)) // default open
  );

  useEffect(() => {
    // keep defaults in sync if the root list changes (e.g., after a new seed)
    setOpenParents((prev) => {
      const next = new Set<number>(prev);
      // ensure new roots are opened by default
      roots.forEach((r) => next.add(r.id));
      // prune removed roots
      for (const id of Array.from(next)) {
        if (!roots.find((r) => r.id === id)) next.delete(id);
      }
      return next;
    });
  }, [roots.map((r) => r.id).join('|')]);

  const toggleParent = (id: number) => {
    setOpenParents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  
  return (
    <nav className="text-sm">
      {/* Group root items (no parent_id) under their category */}
      <CategoryGrouped
        roots={childrenOf(null)}
        childrenOf={childrenOf}
        current={current}
        openParents={openParents}
        toggleParent={toggleParent}
      />
    </nav>
  );
}

function CategoryGrouped({
  roots,
  childrenOf,
  current,
  openParents,
  toggleParent,
}: {
  roots: IndexItem[];
  childrenOf: (id: number | null) => IndexItem[];
  current: string;
  openParents: Set<number>;
  toggleParent: (id: number) => void;
}) {
  if (!roots.length) return null;

  const groups = new Map<string, IndexItem[]>();
  for (const it of roots) {
    const cat = getCategory(it);
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(it);
  }

  // sort category names and keep items inside already title-sorted
  const categories = Array.from(groups.keys()).sort((a, b) => a.localeCompare(b));

  return (
    <div className="space-y-3">
      {categories.map((cat) => (
        <div key={cat}>
          <div className="px-2 pt-2 pb-1 text-[11px] uppercase tracking-wide text-foreground/60 font-medium">
            {cat}
          </div>
          <MenuLevel
            items={groups.get(cat)!}
            childrenOf={childrenOf}
            current={current}
            openParents={openParents}
            toggleParent={toggleParent}
          />
        </div>
      ))}
    </div>
  );
}

function MenuLevel({ items, childrenOf, current, openParents, toggleParent, depth = 0 }: { items: IndexItem[]; childrenOf: (id: number | null) => IndexItem[]; current: string; openParents: Set<number>; toggleParent: (id: number) => void; depth?: number }) {
  if (!items.length) return null;
  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const children = childrenOf(item.id);
        const isActive = current === item.slug;
        const hasChildren = children.length > 0;
        const expanded = depth === 0 ? openParents.has(item.id) : true;
        return (
          <li key={item.id}>
            <div className={cn('flex items-center rounded-md hover:bg-foreground/5', (isActive ? 'font-bold' : ''))}>
              <Link
                href={`/docs/${item.slug}`}
                className={
                  `block  px-2 py-1.5 transition-colors flex-1 `
                }
              >
                {item.title}
              </Link>
              {depth === 0 && hasChildren && (
                <button
                  type="button"
                  onClick={() => toggleParent(item.id)}
                  className="cursor-pointer shrink-0 mr-1 h-5 w-5 flex items-center justify-center dark:text-stone-300/85 text-stone-800"
                  aria-label={expanded ? 'Collapse' : 'Expand'}
                  aria-expanded={expanded}
                >
                  <ChevronRight className={cn('transition-transform duration-100 size-4',expanded ? 'rotate-90' :'')} />
                </button>
              )}
            </div>
            {hasChildren && expanded && (
              <div className="ml-3 mt-1 border-l pl-2">
                <MenuLevel
                  items={children}
                  childrenOf={childrenOf}
                  current={current}
                  openParents={openParents}
                  toggleParent={toggleParent}
                  depth={depth + 1}
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
