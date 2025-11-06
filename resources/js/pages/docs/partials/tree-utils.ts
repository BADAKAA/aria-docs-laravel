import { Post } from "@/types";

export type TreeNode = Post & { children: TreeNode[] };

export function buildTree(items: Post[]): TreeNode[] {
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
        nodes.sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || a.id - b.id);
        nodes.forEach((n) => sortChildren(n.children));
    };
    sortChildren(roots);
    return roots;
}

export const reindex = (items: Post[]) => items.map((x, i) => ({ ...x, position: i }));

export const flattenWithPositions = (
    nodes: TreeNode[],
    parent_id: number | null,
): { id: number; parent_id: number | null; position: number }[] => {
    const res: { id: number; parent_id: number | null; position: number }[] = [];
    nodes.forEach((n, idx) => {
        res.push({ id: n.id, parent_id, position: idx });
        if (n.children.length) res.push(...flattenWithPositions(n.children, n.id));
    });
    return res;
};
