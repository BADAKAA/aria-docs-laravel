import AppLayout from '@/layouts/app-layout';
import { Head, usePage, router } from '@inertiajs/react';
import { Post, type BreadcrumbItem } from '@/types';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useDragTouch } from '@/hooks/useDragTouch';
import { order } from '@/routes/docs';
import { buildTree, flattenWithPositions, reindex } from './partials/tree-utils';
import { SiblingList } from './partials/tree-list';

// Minimal tree DnD without external deps: flat list with parent selection and drag sorting within siblings
// Payload shape expected by backend: { items: Array<{ id: number; parent_id: number | null; position: number }> }

export default function DocsOrderPage() {
    const page = usePage().props as any;
    const docs = page.docs as Post[];
    const [list, setList] = useState<Post[]>(docs);

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
        const updates: Post[] = [];
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
    const getChildren = (pid: number | null) =>
        list
            .filter((x) => (x.parent_id || null) === (pid || null))
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || a.id - b.id);
    const applyUpdates = (updated: Post[]) => {
        const map = new Map(updated.map((x) => [x.id, x] as const));
        setList((prev) => prev.map((x) => (map.has(x.id) ? map.get(x.id)! : x)));
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
                <p className="text-xs text-muted-foreground">
                    Tip: Drag a row onto a sibling to re-order within the same level. Drag a row onto a parent title to nest it under that parent.
                </p>
            </div>
        </AppLayout>
    );
}
