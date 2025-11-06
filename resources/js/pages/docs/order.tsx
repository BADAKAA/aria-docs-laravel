import AppLayout from '@/layouts/app-layout';
import { Head, usePage, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useDragTouch } from '@/hooks/useDragTouch';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { order } from '@/routes/docs';

// Minimal tree DnD without external deps: flat list with parent selection and drag sorting within siblings
// Payload shape expected by backend: { items: Array<{ id: number; parent_id: number | null; position: number }> }

type DocItem = { id: number; title: string; slug: string; category: string | null; parent_id: number | null; position: number };

type TreeNode = DocItem & { children: TreeNode[] };

function buildTree(items: DocItem[]): TreeNode[] {
    const map = new Map<number, TreeNode>();
    const roots: TreeNode[] = [];
    items.forEach((it) => map.set(it.id, { ...it, children: [] }));
    map.forEach((node) => {
        if (node.parent_id != null && map.has(node.parent_id)) {
            map.get(node.parent_id)!.children.push(node);
        } else {
            roots.push(node);
        }
    });
    const sortChildren = (nodes: TreeNode[]) => {
        nodes.sort((a, b) => a.position - b.position || a.id - b.id);
        nodes.forEach((n) => sortChildren(n.children));
    };
    sortChildren(roots);
    return roots;
}

export default function DocsOrderPage() {
    const page = usePage().props as any;
    const docs = page.docs as DocItem[];
    const [list, setList] = useState<DocItem[]>(docs);

    useEffect(() => setList(docs), [docs]);

    const tree = useMemo(() => buildTree(list), [list]);

    // Live preview (same-level only): { parentId, index } and overlay rect (no layout shift)
    const [preview, setPreview] = useState<{ parentId: number | null; index: number } | null>(null);
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

    const flattenWithPositions = (nodes: TreeNode[], parent_id: number | null) => {
        const res: { id: number; parent_id: number | null; position: number }[] = [];
        nodes.forEach((n, idx) => {
            res.push({ id: n.id, parent_id, position: idx });
            if (n.children.length) res.push(...flattenWithPositions(n.children, n.id));
        });
        return res;
    };

    const onSave = () => {
        const payload = { items: flattenWithPositions(tree, null) };
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
            if (!row) return;
            const asChildZone = !!(el as HTMLElement | null)?.closest?.('.drop-as-child');
            if (asChildZone) {
                const targetId = Number(row.getAttribute('data-node-id'));
                const childCount = getChildren(targetId).length;
                setPreview({ parentId: targetId, index: childCount });
                return;
            }
            const parentIdAttr = row.getAttribute('data-parent-id');
            const idxAttr = row.getAttribute('data-index');
            if (parentIdAttr === null || idxAttr === null) return;
            const parentId = parentIdAttr === 'null' ? null : Number(parentIdAttr);
            const idx = Number(idxAttr);
            const rect = row.getBoundingClientRect();
            const before = touch.clientY < rect.top + rect.height / 2;
            setPreview({ parentId, index: before ? idx : idx + 1 });
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

        // Build ordered arrays for old and new siblings
        const oldSiblings = getChildren(fromParent);
        const newSiblings = getChildren(toParent);

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
        const updates: DocItem[] = [];
        // Reindex old siblings (if parent changed)
        if (fromParent !== toParent) {
            const reOld = reindex(oldIds.map((id) => oldSiblings.find((s) => s.id === id)!));
            updates.push(...reOld);
        }

        // Reindex new siblings with dragged included
        const newArray = targetIds.map((id) => (id === dragId ? { ...dragged, parent_id: toParent } : newSiblings.find((s) => s.id === id)!));
        const reNew = reindex(newArray);
        updates.push(...reNew);

        applyUpdates(updates);
        setPreview(null);
    };

    // Indent/Outdent helpers
    const getChildren = (pid: number | null) => list.filter((x) => (x.parent_id || null) === (pid || null)).sort((a, b) => a.position - b.position || a.id - b.id);
    const reindex = (items: DocItem[]) => items.map((x, i) => ({ ...x, position: i }));
    const applyUpdates = (updated: DocItem[]) => {
        const map = new Map(updated.map((x) => [x.id, x] as const));
        setList((prev) => prev.map((x) => (map.has(x.id) ? map.get(x.id)! : x)));
    };
    // Flatten in the same visual order we render: all rows at this level, then recursively children of each node, in order
    const flattenVisible = (nodes: TreeNode[]): number[] => {
        const idsAtLevel = nodes.map((n) => n.id);
        const childrenIds = nodes.flatMap((n) => flattenVisible(n.children));
        return [...idsAtLevel, ...childrenIds];
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
        const oldSiblings = getChildren(node.parent_id || null);
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
        const node = list.find((x) => x.id === id);
        if (!node || node.parent_id == null) return;
        const parent = list.find((x) => x.id === node.parent_id);
        if (!parent) return;
        const grand = parent.parent_id || null;
        const gpChildren = getChildren(grand);
        const parentIndex = gpChildren.findIndex((c) => c.id === parent.id);
        const insertPos = parentIndex + 1;
        const newGpOrder = gpChildren.map((c) => c.id).filter((cid) => cid !== id);
        newGpOrder.splice(insertPos, 0, id);
        const newGpChildren = reindex(newGpOrder.map((cid) => (cid === id ? { ...node, parent_id: grand } : gpChildren.find((c) => c.id === cid)!)));
        const oldParentChildren = reindex(getChildren(parent.id).filter((c) => c.id !== id));
        applyUpdates([
            ...newGpChildren,
            ...oldParentChildren,
        ]);
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Docs Order', href: '/docs/order' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Docs Order" />
            <div className="p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-lg font-semibold">Order Documentation</h1>
                    <Button onClick={onSave}>Save Order</Button>
                </div>
                <SiblingList
                    parentId={null}
                    items={tree}
                    depth={0}
                    dragTouchHandlers={dragTouchHandlers}
                    setPreview={setPreview}
                    indent={indent}
                    outdent={outdent}
                />
                {/* Global overlay preview line to avoid layout shift */}
                {previewRect && (
                    <div
                        style={{ position: 'fixed', top: previewRect.top - 5, left: previewRect.left, width: previewRect.width, height: 2, background: 'currentColor', opacity: 0.5, pointerEvents: 'none', zIndex: 50 }}
                        className="text-foreground"
                    />
                )}
                <p className="text-xs text-muted-foreground">Tip: Drag a row onto a sibling to re-order within the same level. Drag a row onto a parent title to nest it under that parent.</p>
            </div>
        </AppLayout>
    );
}

function SiblingList({ parentId, items, depth, dragTouchHandlers, setPreview, indent, outdent }: { parentId: number | null; items: TreeNode[]; depth: number; dragTouchHandlers: (getPayload: () => any) => any; setPreview: (p: { parentId: number | null; index: number } | null) => void; indent: (id: number) => void; outdent: (id: number) => void }) {
    const listRef = useRef<HTMLUListElement | null>(null);
    const onContainerDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        // If we're over a row, let the row's handler compute preview
        const target = e.target as HTMLElement;
        if (target.closest('[data-node-id]')) return;
        // Compute insert index based on cursor Y relative to rows at this level
        const ul = listRef.current;
        if (!ul) { setPreview({ parentId, index: items.length }); return; }
        const selector = `:scope > li[data-parent-id="${String(parentId)}"][data-node-id]`;
        const rows = Array.from(ul.querySelectorAll(selector)) as HTMLElement[];
        if (rows.length === 0) { setPreview({ parentId, index: 0 }); return; }
        const y = e.clientY;
        let index = rows.length;
        for (let i = 0; i < rows.length; i++) {
            const r = rows[i].getBoundingClientRect();
            if (y < r.top + r.height / 2) { index = i; break; }
        }
        setPreview({ parentId, index });
    };
    return (
    <ul ref={listRef} onDragOver={onContainerDragOver}>
            {items.map((node, idx) => (
                <li key={node.id} data-node-id={node.id} data-parent-id={String(parentId)} data-index={idx} className="not-last:pb-2 first:pt-2">
                    <TreeNodeRow idx={idx} node={node} depth={depth} parentId={parentId} dragTouchHandlers={dragTouchHandlers} setPreview={setPreview} indent={indent} outdent={outdent} />
                    {node.children.length > 0 ? (
                        <SiblingList
                            parentId={node.id}
                            items={node.children}
                            depth={depth + 1}
                            dragTouchHandlers={dragTouchHandlers}
                            setPreview={setPreview}
                            indent={indent}
                            outdent={outdent}
                        />
                    ) : null}
                </li>
            ))}
        </ul>
    );
}

function TreeNodeRow({ node, idx, depth, parentId, dragTouchHandlers, setPreview, indent, outdent }: { node: TreeNode; idx: number; depth: number; parentId: number | null; dragTouchHandlers: (getPayload: () => any) => any; setPreview: (p: { parentId: number | null; index: number } | null) => void; indent: (id: number) => void; outdent: (id: number) => void }) {
    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const before = e.clientY < rect.top + rect.height / 2;
        setPreview({ parentId, index: before ? idx : idx + 1 });
    };
    const onDragOverTitle = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Dropping over the title nests under this node, appended to its children
        setPreview({ parentId: node.id, index: node.children.length });
    };
    return (
        <div
            {...dragTouchHandlers(() => ({ id: node.id }))}
            onDragOver={onDragOver}
            className="flex items-center gap-2 rounded-md border px-2 py-1 bg-background hover:bg-muted/50"
            style={{ marginLeft: depth * 16 }}
        >
            <span className="cursor-grab select-none text-muted-foreground">⁞⁞</span>
            <div className="flex-1 min-w-0 drop-as-child" onDragOver={onDragOverTitle}>
                <div className="font-medium truncate">{node.title}</div>
                <div className="text-xs text-muted-foreground truncate">/{node.slug}</div>
            </div>
            <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" className="h-7 px-2" title="Outdent" onClick={() => outdent(node.id)}>
                    <ArrowLeft className="size-4" />
                </Button>
                <Button type="button" variant="ghost" className="h-7 px-2" title="Indent" onClick={() => indent(node.id)}>
                    <ArrowRight className="size-4" />
                </Button>
            </div>
        </div>
    );
}
