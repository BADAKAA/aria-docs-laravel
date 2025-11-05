import type { TocItem } from "@/lib/markdown-react";
import TocObserver from "./toc-observer";

export default function Toc({ items }: { items: TocItem[] }) {
  if (!items?.length) return null;
  return (
    <div className="xl:flex toc hidden w-[20rem] py-9 sticky top-16 h-[96.95vh] pl-6">
      <div className="flex flex-col gap-3 w-full pl-2">
        <h3 className="text-sm">On this page</h3>
        <div className="pb-2 pt-0.5 overflow-y-auto">
          <TocObserver data={items} />
        </div>
      </div>
    </div>
  );
}
