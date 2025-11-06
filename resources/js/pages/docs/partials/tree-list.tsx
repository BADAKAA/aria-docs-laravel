import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { TreeNode } from './tree-utils';

export type PreviewState = { parentId: number | null; index: number } | null;

export function SiblingList({
    parentId,
    items,
    depth,
    dragTouchHandlers,
    setPreview,
    indent,
    outdent,
}: {
    parentId: number | null;
    items: TreeNode[];
    depth: number;
    dragTouchHandlers: (getPayload: () => any) => any;
    setPreview: (p: { parentId: number | null; index: number } | null) => void;
    indent: (id: number) => void;
    outdent: (id: number) => void;
}) {
    const listRef = useRef<HTMLUListElement | null>(null);
    const onContainerDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        // If we're over a row, let the row's handler compute preview
        const target = e.target as HTMLElement;
        if (target.closest('[data-node-id]')) return;
        // Compute insert index based on cursor Y relative to rows at this level
        const ul = listRef.current;
        if (!ul) {
            setPreview({ parentId, index: items.length });
            return;
        }
        const selector = `:scope > li[data-parent-id="${String(parentId)}"][data-node-id]`;
        const rows = Array.from(ul.querySelectorAll(selector)) as HTMLElement[];
        if (rows.length === 0) {
            setPreview({ parentId, index: 0 });
            return;
        }
        const y = e.clientY;
        let index = rows.length;
        for (let i = 0; i < rows.length; i++) {
            const r = rows[i].getBoundingClientRect();
            if (y < r.top + r.height / 2) {
                index = i;
                break;
            }
        }
        setPreview({ parentId, index });
    };
    return (
        <ul ref={listRef} onDragOver={onContainerDragOver}>
            {items.map((node, idx) => (
                <li
                    key={node.id}
                    data-node-id={node.id}
                    data-parent-id={String(parentId)}
                    data-index={idx}
                    className="not-last:pb-2 first:pt-2"
                >
                    <TreeNodeRow
                        idx={idx}
                        node={node}
                        depth={depth}
                        parentId={parentId}
                        dragTouchHandlers={dragTouchHandlers}
                        setPreview={setPreview}
                        indent={indent}
                        outdent={outdent}
                    />
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

export function TreeNodeRow({
    node,
    idx,
    depth,
    parentId,
    dragTouchHandlers,
    setPreview,
    indent,
    outdent,
}: {
    node: TreeNode;
    idx: number;
    depth: number;
    parentId: number | null;
    dragTouchHandlers: (getPayload: () => any) => any;
    setPreview: (p: { parentId: number | null; index: number } | null) => void;
    indent: (id: number) => void;
    outdent: (id: number) => void;
}) {
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
