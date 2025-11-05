import { Edit, Github } from "lucide-react";
import AppLogo from "./app-logo";
import AppearanceToggleDropdown from "./appearance-dropdown";
import { Link, usePage } from "@inertiajs/react";
import { SharedData } from "@/types";
import { dashboard, login, register } from "@/routes";
import { Button } from "./ui/button";
import { index as blogIndex } from "@/routes/blog";
import { index as docsIndex } from "@/routes/docs";
import { useEffect, useState } from "react";
import SearchModal from "./search-modal";

export function Header({
  canRegister = true,
}: {
  canRegister?: boolean;
}) {

  const auth = usePage<SharedData>().props.auth;
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const [searchOpen, setSearchOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const metaPressed = isMac ? e.metaKey : e.ctrlKey;
      if (metaPressed && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <nav className="w-full border-b h-16 mb-8 sticky top-0 z-50 bg-background">
      <div className="container mx-auto w-[95vw] h-full flex items-center justify-between gap-2">
        <div className="flex items-center gap-5">
          <AppLogo />
          <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
            <a className={`hover:text-foreground ${currentPath.startsWith('/docs') ? 'font-semibold text-foreground' : ''}`} href={docsIndex().url}>Documentation</a>
            <a className={`hover:text-foreground ${currentPath.startsWith('/blog') ? 'font-semibold text-foreground' : ''}`} href={blogIndex().url}>Blog</a>
            <a className="hover:text-foreground" href="#">Examples</a>
            <a className="hover:text-foreground" href="#">Guides</a>
            <a className="hover:text-foreground" href="https://github.com/nisabmohd/Aria-Docs/discussions">Community</a>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-1 w-[90%] md:w-auto">
          {/* Search opener */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="relative border rounded-lg w-full md:w-64 px-3 py-2 text-left text-sm text-muted-foreground hover:text-foreground"
            aria-label="Open search"
          >
            <span>Search docs and blog…</span>
            <span className="absolute right-2 top-2 hidden sm:flex items-center gap-1 text-xs font-mono text-muted-foreground">
              <span className="border rounded px-1 py-0.5">Ctrl</span>
              <span className="border rounded px-1 py-0.5">K</span>
            </span>
          </button>
          <div className="hidden sm:flex items-center gap-2">
            <Link href="https://github.com/nisabmohd/NexDocs" >
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md">
                <Github className="size-4" />
              </Button>
            </Link>
            <AppearanceToggleDropdown />
            <Link href={dashboard()}>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md">
                <Edit className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </nav>
  );
}

export default Header;
