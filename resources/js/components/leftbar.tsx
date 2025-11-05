import DocsMenu from './docs-menu';

export function Leftbar() {
  return (
    <aside className="md:flex hidden w-[20rem] sticky top-16 flex-col h-[93.75vh] overflow-y-auto">
      <div className="py-4 px-2">
        <DocsMenu />
      </div>
    </aside>
  );
}
