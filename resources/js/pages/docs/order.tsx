import AppLayout from '@/layouts/app-layout';
import { Head, usePage, router } from '@inertiajs/react';
import { Post, type BreadcrumbItem } from '@/types';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useDragTouch } from '@/hooks/useDragTouch';
import { order } from '@/routes/docs';
import { buildTree, flattenWithPositions, reindex } from './partials/tree-utils';
import { SiblingList } from './partials/tree-list';
import { Eye, EyeClosed, PlusCircle } from 'lucide-react';

// Minimal tree DnD without external deps: flat list with parent selection and drag sorting within siblings
// Payload shape expected by backend: { items: Array<{ id: number; parent_id: number | null; position: number }> }

type PostWithCatKey = Post & { _ck?: string };

export default function DocsOrderPage() {
    const page = usePage().props as any;
    // page.docs is grouped by category from the backend: Record<string, Post[]>
    const grouped: Record<string, Post[]> = page.docs || {};
    const initialCategories = useMemo(() => {
        const entries = Object.entries(grouped) as [string, Post[]][];
        // Build stable keys from original group keys; derive names from first post.category
        return entries.map(([rawKey, arr]) => {
            const name = (arr[0]?.category ?? '') as string | null;
            const key = name && name !== '' ? String(name) : '__null__';
            return { key, name: name ?? '' };
        });
    }, [grouped]);
    const [categories, setCategories] = useState<Array<{ key: string; name: string }>>(initialCategories);
    // Map for quick lookup
    const catNameByKey = useMemo(() => Object.fromEntries(categories.map((c) => [c.key, c.name])), [categories]);

    // Flatten docs with category key retained for roots
    const initialList: PostWithCatKey[] = useMemo(() => {
        const res: PostWithCatKey[] = [];
        Object.values(grouped).forEach((arr) => {
            const cat = (arr[0]?.category ?? '') as string | null;
            const key = cat && cat !== '' ? String(cat) : '__null__';
            arr.forEach((p) => {
                const isRoot = (p.parent_id ?? null) === null;
                res.push(isRoot ? { ...p, _ck: key } : { ...p });
            });
        });
        return res;
    }, [grouped]);

    const [list, setList] = useState<PostWithCatKey[]>(initialList);

    // If server changes docs grouping, reset local state
    useEffect(() => {
        setList(initialList);
        setCategories(initialCategories);
    }, [initialList, initialCategories]);

    const tree = useMemo(() => buildTree(list as unknown as Post[]), [list]);
    // Build an id->node map for fast lookup when selecting category roots
    const idToNode = useMemo(() => {
        const map = new Map<number, any>();
        const visit = (nodes: any[]) => {
            nodes.forEach((n) => {
                map.set(n.id, n);
                if (n.children?.length) visit(n.children);
            });
        };
        visit(tree as any);
        return map;
    }, [tree]);

    // Live preview (same-level only): { parentId, index } and overlay rect (no layout shift)
    const [preview, setPreview] = useState<{ parentId: number | null; index: number; categoryKey?: string } | null>(null);
    const [previewRect, setPreviewRect] = useState<{ top: number; left: number; width: number } | null>(null);

    useEffect(() => {
        if (!preview) { setPreviewRect(null); return; }
    const parentSel = `li[data-parent-id="${String(preview.parentId)}"]`;
        const rows = Array.from(document.querySelectorAll(parentSel)) as HTMLElement[];
        rows.sort((a, b) => (Number(a.getAttribute('data-index')) || 0) - (Number(b.getAttribute('data-index')) || 0));
        if (rows.length === 0) { setPreviewRect(null); return; }
        const rectOf = (rowEl: HTMLElement) => {
            const inner = rowEl.querySelector(':scope > div');
            const elem = (inner as HTMLElement) || rowEl;
            return elem.getBoundingClientRect();
        };
        if (preview.index < rows.length) {
            const r = rectOf(rows[preview.index]);
            setPreviewRect({ top: r.top, left: r.left, width: r.width });
        } else {
            const r = rectOf(rows[rows.length - 1]);
            setPreviewRect({ top: r.bottom, left: r.left, width: r.width });
        }
    }, [preview]);

    const onSave = () => {
        // Compose payload: include category for root items based on current category names map
        const flat = flattenWithPositions(tree as any, null);
        const idToCatKey = new Map<number, string | undefined>();
        list.forEach((p) => { if ((p.parent_id ?? null) === null) idToCatKey.set(p.id, p._ck); });
        const items = flat.map((it) => {
            const ck = idToCatKey.get(it.id);
            const catName = ck ? (catNameByKey[ck] ?? '') : '';
            return {
                id: it.id,
                parent_id: it.parent_id,
                position: it.position,
                // Only include category for roots (null/empty -> will be normalized to null backend-side)
                category: it.parent_id === null ? (catName ?? '') : null,
            };
        });
        const payload = { items } as any;
        router.post(order().url, payload, { preserveScroll: true });
    };

    // Drag & Drop (desktop + touch)
    const [dragId, setDragId] = useState<number | null>(null);
    const { dragTouchHandlers } = useDragTouch({
        onStart: (payload) => setDragId(payload?.id ?? null),
        onMove: (_payload, ev) => {
            // Touch preview: compute target row and insert index
            if (!(ev as any).changedTouches && !(ev as any).touches) return;
            const touch = ((ev as any).changedTouches || (ev as any).touches)[0];
            const el = document.elementFromPoint(touch.clientX, touch.clientY);
            const row = el?.closest?.('[data-node-id]') as HTMLElement | null;
            const card = (el as HTMLElement | null)?.closest?.('[data-category-key]') as HTMLElement | null;
            const categoryKey = card?.getAttribute('data-category-key') || undefined;
            if (!row) {
                // Touch over empty card area: allow dropping as root into that category
                if (card) {
                    setPreview({ parentId: null, index: 0, categoryKey });
                }
                return;
            }
            // If a row exists, use its closest card category
            const rowCard = row.closest?.('[data-category-key]') as HTMLElement | null;
            const rowCategoryKey = rowCard?.getAttribute('data-category-key') || categoryKey || undefined;
            const asChildZone = !!(el as HTMLElement | null)?.closest?.('.drop-as-child');
            if (asChildZone) {
                const targetId = Number(row.getAttribute('data-node-id'));
                const childCount = getChildren(targetId).length;
                setPreview({ parentId: targetId, index: childCount, categoryKey: rowCategoryKey });
                return;
            }
            const parentIdAttr = row.getAttribute('data-parent-id');
            const idxAttr = row.getAttribute('data-index');
            if (parentIdAttr === null || idxAttr === null) return;
            const parentId = parentIdAttr === 'null' ? null : Number(parentIdAttr);
            const idx = Number(idxAttr);
            const rect = row.getBoundingClientRect();
            const before = touch.clientY < rect.top + rect.height / 2;
            setPreview({ parentId, index: before ? idx : idx + 1, categoryKey: rowCategoryKey });
        },
        onEnd: () => {
            commitDrop();
            setDragId(null);
        },
    });
    const commitDrop = () => {
        if (dragId === null || !preview) return;
        const dragged = list.find((x) => x.id === dragId);
        if (!dragged) return;
        const fromParent = dragged.parent_id || null;
        const toParent = preview.parentId || null;
        const fromRoot = fromParent === null;
        const toRoot = toParent === null;

        // Build ordered arrays for old and new siblings
        const oldSiblings = getChildren(fromParent, fromRoot ? (dragged as PostWithCatKey)._ck : undefined);
        const newSiblings = getChildren(toParent, toRoot ? (preview.categoryKey as string | undefined) : undefined);

        // Remove dragged from old siblings
        const oldIds = oldSiblings.map((s) => s.id).filter((id) => id !== dragId);

        // Determine insert index within target siblings
        const insertIndex = Math.max(0, Math.min(preview.index, (fromParent === toParent ? oldIds.length : newSiblings.length)));

        // Start from the correct base array for insertion
        let targetIds: number[];
        if (fromParent === toParent) {
            targetIds = oldIds.slice();
        } else {
            targetIds = newSiblings.map((s) => s.id);
        }
        targetIds.splice(insertIndex, 0, dragId);

        // Create maps of updated items
        const updates: PostWithCatKey[] = [];
        // Reindex old siblings (if parent changed)
        if (fromParent !== toParent) {
            const reOld = reindex(oldIds.map((id) => oldSiblings.find((s) => s.id === id)!));
            updates.push(...reOld);
        }

        // Reindex new siblings with dragged included
        const newArray = targetIds.map((id) => {
            if (id === dragId) {
                const base = { ...dragged, parent_id: toParent } as PostWithCatKey;
                if (toRoot) base._ck = preview.categoryKey ?? base._ck;
                return base;
            }
            return newSiblings.find((s) => s.id === id)! as PostWithCatKey;
        });
        const reNew = reindex(newArray);
        updates.push(...reNew);

        applyUpdates(updates);
        setPreview(null);
    };

    // Indent/Outdent helpers
    const getChildren = (pid: number | null, categoryKey?: string) =>
        list
            .filter((x) => (x.parent_id || null) === (pid || null))
            .filter((x) => (pid === null ? ((x as PostWithCatKey)._ck ?? '__null__') === (categoryKey ?? (x as PostWithCatKey)._ck ?? '__null__') : true))
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || a.id - b.id);
    const applyUpdates = (updated: PostWithCatKey[]) => {
        const map = new Map(updated.map((x) => [x.id, x] as const));
        setList((prev) => prev.map((x) => (map.has(x.id) ? ({ ...x, ...map.get(x.id)! }) : x)));
    };
    const indent = (id: number) => {
        const node = list.find((x) => x.id === id);
        if (!node) return;
        // Find the visually previous row in the DOM
        const currentEl = document.querySelector(`li[data-node-id="${id}"]`) as HTMLElement | null;
        if (!currentEl) return;
        const findPrevRow = (el: HTMLElement | null): HTMLElement | null => {
            let cur: HTMLElement | null = el;
            while (cur) {
                if (cur.previousElementSibling) {
                    let prev = cur.previousElementSibling as HTMLElement;
                    // Dive into the last descendant row if any
                    const allRows = prev.querySelectorAll('[data-node-id]');
                    if (allRows.length > 0) return allRows[allRows.length - 1] as HTMLElement;
                    if (prev.hasAttribute('data-node-id')) return prev;
                    cur = prev;
                } else {
                    // climb up; the container li (row) itself could be the previous
                    cur = cur.parentElement as HTMLElement | null;
                    if (cur && cur.hasAttribute && cur.hasAttribute('data-node-id')) return cur;
                }
            }
            return null;
        };
        const prevRow = findPrevRow(currentEl);
        if (!prevRow) return; // nothing above
        const targetId = Number(prevRow.getAttribute('data-node-id'));
        if (!targetId || targetId === id) return;
        const newParentId = targetId;

        // Remove from old parent's children and reindex
        const oldSiblings = getChildren(node.parent_id || null, (node.parent_id ?? null) === null ? (node as PostWithCatKey)._ck : undefined);
        const newOldSiblings = reindex(oldSiblings.filter((s) => s.id !== id));
        // Append to new parent's children and reindex
        const curChildren = getChildren(newParentId);
        const appended = reindex([...curChildren, { ...node, parent_id: newParentId, position: Number.MAX_SAFE_INTEGER }]);
        applyUpdates([
            { ...node, parent_id: newParentId, position: appended.find((c) => c.id === id)!.position },
            ...newOldSiblings,
            ...appended,
        ]);
    };
    const outdent = (id: number) => {
        const node = list.find((x) => x.id === id) as PostWithCatKey | undefined;
        if (!node || node.parent_id == null) return;
        const parent = list.find((x) => x.id === node.parent_id);
        if (!parent) return;
        const grand = parent.parent_id || null;
        const gpChildren = getChildren(grand, grand === null ? (parent as PostWithCatKey)._ck : undefined);
        const parentIndex = gpChildren.findIndex((c) => c.id === parent.id);
        const insertPos = parentIndex + 1;
        const newGpOrder = gpChildren.map((c) => c.id).filter((cid) => cid !== id);
        newGpOrder.splice(insertPos, 0, id);
        const newGpChildren = reindex(newGpOrder.map((cid) => (cid === id ? { ...node, parent_id: grand, _ck: grand === null ? (parent as PostWithCatKey)._ck : (node as PostWithCatKey)._ck } : gpChildren.find((c) => c.id === cid)!)));
        const oldParentChildren = reindex(getChildren(parent.id).filter((c) => c.id !== id));
        applyUpdates([
            ...newGpChildren,
            ...oldParentChildren,
        ]);
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Order Docs', href: '/docs/order' },
    ];

    // Category filter (multi-select)
    const newCatCounter = useRef<number>(1);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(
        () => new Set(initialCategories.map((c) => c.key))
    );
    useEffect(() => {
        // When server-provided categories change, reset selection to show all
        setSelectedKeys(new Set(initialCategories.map((c) => c.key)));
    }, [initialCategories]);
    const toggleKey = (key: string) => {
        setSelectedKeys((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    };
    const showAll = () => setSelectedKeys(new Set(categories.map((c) => c.key)));
    const hideAll = () => setSelectedKeys(new Set());
    const addCategory = () => {
        const key = `__new__${newCatCounter.current++}`;
        setCategories((prev) => [...prev, { key, name: 'New Category' }]);
        setSelectedKeys((prev) => new Set([...Array.from(prev), key]));
    };
    const filteredCategories = useMemo(() => {
        return categories.filter((c) => selectedKeys.has(c.key));
    }, [categories, selectedKeys]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Docs Order" />
            <div className="p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-lg font-semibold">Order Documentation</h1>
                    <Button onClick={onSave}>Save Order</Button>
                </div>
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                    {categories.map((c) => {
                        const selected = selectedKeys.has(c.key);
                        return (
                            <Button
                            key={c.key}
                            variant={selected ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => toggleKey(c.key)}
                            title={selected ? 'Click to hide' : 'Click to show'}
                            >
                                {c.name?.trim() !== '' ? c.name : 'Uncategorized'}
                            </Button>
                        );
                    })}
                    <Button size="sm" variant="secondary" onClick={addCategory} title="New category"><PlusCircle/></Button>
                    <Button variant="outline" size="sm" onClick={showAll} className='ml-auto'>
                        <Eye/>
                        Show all
                    </Button>
                    <Button variant="outline" size="sm" onClick={hideAll}>
                        <EyeClosed/>
                        Hide all
                    </Button>
                </div>

                {/* Category Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredCategories.map((cat) => {
                        // Prepare roots for this category by ids
                        const rootIds = list
                            .filter((p) => (p.parent_id ?? null) === null && (p as PostWithCatKey)._ck === cat.key)
                            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || a.id - b.id)
                            .map((p) => p.id);
                        const roots = rootIds
                            .map((id) => idToNode.get(id))
                            .filter(Boolean);
                        return (
                            <div key={cat.key} className="border rounded-md bg-background" data-category-key={cat.key}>
                                <div className="px-3 py-2 border-b flex items-center gap-2">
                                    <input
                                        className="flex-1 bg-transparent outline-none text-sm font-medium"
                                        placeholder="Uncategorized"
                                        value={catNameByKey[cat.key] ?? ''}
                                        onChange={(e) => {
                                            const name = e.target.value;
                                            setCategories((prev) => prev.map((c) => (c.key === cat.key ? { ...c, name } : c)));
                                        }}
                                    />
                                </div>
                                <div
                                    className="p-2"
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        // Allow dropping as root into this category when hovering card space
                                        setPreview({ parentId: null, index: roots.length, categoryKey: cat.key });
                                    }}
                                >
                                    {roots.length === 0 ? (
                                        <div className="border border-dashed rounded-md p-6 text-center text-sm text-muted-foreground select-none">
                                            Drag items here
                                        </div>
                                    ) : null}
                                    <SiblingList
                                        parentId={null}
                                        items={roots as any}
                                        depth={0}
                                        dragTouchHandlers={dragTouchHandlers}
                                        setPreview={setPreview}
                                        indent={indent}
                                        outdent={outdent}
                                        categoryKey={cat.key}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
                {/* Global overlay preview line to avoid layout shift */}
                {previewRect && (
                    <div
                        style={{ position: 'fixed', top: previewRect.top - 5, left: previewRect.left, width: previewRect.width, height: 2, background: 'currentColor', opacity: 0.5, pointerEvents: 'none', zIndex: 50 }}
                        className="text-foreground"
                    />
                )}
                <p className="text-xs text-muted-foreground">
                    Tip: Drag a row onto a sibling to re-order within the same level. Drag a row onto a parent title to nest it under that parent.
                </p>
            </div>
        </AppLayout>
    );
}
