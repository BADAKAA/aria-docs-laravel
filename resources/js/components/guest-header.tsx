import { Edit, Github, Search, Menu, LogIn } from "lucide-react";
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
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import DocsMenu from "@/components/docs-menu";

export function Header({
  canRegister = true,
}: {
  canRegister?: boolean;
}) {

  const auth = usePage<SharedData>().props.auth;
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const [searchOpen, setSearchOpen] = useState(false);
  const navLinks = [
    { title: 'Documentation', href: docsIndex().url, isActive: currentPath.startsWith('/docs') },
    { title: 'Blog', href: blogIndex().url, isActive: currentPath.startsWith('/blog') },
    { title: 'Examples', href: '#', isActive: false },
    { title: 'Guides', href: '#', isActive: false },
    { title: 'Community', href: 'https://github.com/nisabmohd/Aria-Docs/discussions', isActive: false },
  ];
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
    <nav className="w-full border-b h-16 sticky top-0 z-50 bg-background">
      <div className="sm:container mx-auto w-[95vw] h-full flex items-center sm:justify-between md:gap-2">
        <div className="flex items-center sm:gap-5 gap-2.5">
          {/* Mobile left sheet trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden rounded-md">
                <Menu className="h-[1.15rem] w-[1.15rem]" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <div className="p-4 border-b">
                <AppLogo />
              </div>
              <div className="p-2 overflow-y-auto">
                <nav className="flex flex-col gap-1 px-2 pb-3 text-sm">
                  {navLinks.map((l) => (
                    <SheetClose asChild key={l.title + l.href}>
                      <Link prefetch
                        className={`hover:text-foreground ${l.isActive ? 'font-semibold text-foreground' : ''}`}
                        href={l.href}
                      >
                        {l.title}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
                <div className="pb-4 max-h-[60vh] overflow-y-auto border-t">
                  <DocsMenu />
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-6">
            <div className="lg:flex hidden">
              <AppLogo />
            </div>
            <div className="md:flex hidden items-center gap-4 text-sm font-medium text-muted-foreground">
              {navLinks.map((l) => (
                <a
                  key={l.title + l.href}
                  className={`hover:text-foreground ${l.isActive ? 'font-semibold text-foreground' : ''}`}
                  href={l.href}
                >
                  {l.title}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center sm:justify-normal justify-between sm:gap-3 ml-1 sm:w-fit w-[90%]">
          {/* Search opener */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="relative border rounded-lg ml-auto md:ml-0 md:w-64 px-2 md:px-3 py-2 text-left text-sm text-muted-foreground hover:text-foreground"
            aria-label="Open search"
          >
            <Search className="md:hidden size-4"/>
            <span className="hidden md:inline">
            <span>Search docs and blog…</span>
            <span className="absolute right-2 top-2 hidden sm:flex items-center gap-1 text-xs font-mono text-muted-foreground">
              <span className="border rounded px-1 py-0.5">Ctrl</span>
              <span className="border rounded px-1 py-0.5">K</span>
            </span>
            </span>
          </button>
          <div className="flex items-center justify-between sm:gap-2">
            <Link href={dashboard()}>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md">
                <Edit className="size-4" />
              </Button>
            </Link>
            <Link href="https://github.com/BADAKAA/aria-docs-laravel" >
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md">
                <Github className="size-4" />
              </Button>
            </Link>
            <AppearanceToggleDropdown />
          </div>
        </div>
      </div>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </nav>
  );
}

export default Header;
