import { Edit, Github } from "lucide-react";
import AppLogo from "./app-logo";
import AppearanceToggleDropdown from "./appearance-dropdown";
import { Link, usePage } from "@inertiajs/react";
import { SharedData } from "@/types";
import { dashboard, login, register } from "@/routes";
import { Button } from "./ui/button";

export function Header({
  canRegister = true,
}: {
  canRegister?: boolean;
}) {

  const auth = usePage<SharedData>().props.auth;
  return (
    <nav className="w-full border-b h-16 mb-8 sticky top-0 z-50 bg-background">
      <div className="container mx-auto w-[95vw] h-full flex items-center justify-between gap-2">
        <div className="flex items-center gap-5">
          <AppLogo />
          <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
            <a className="hover:text-foreground" href="/docs">Documentation</a>
            <a className="hover:text-foreground" href="/blog">Blog</a>
            <a className="hover:text-foreground" href="#">Examples</a>
            <a className="hover:text-foreground" href="#">Guides</a>
            <a className="hover:text-foreground" href="https://github.com/nisabmohd/Aria-Docs/discussions">Community</a>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-1 w-[90%] md:w-auto">
          {/* Simple placeholder search */}
          <div className="relative border rounded-lg w-full md:w-64">
            <input
              type="text"
              placeholder="Search docs"
              className="w-full bg-transparent px-3 py-2 outline-none text-sm"
              aria-label="Search docs"
            />
            <div className="absolute right-2 top-2 hidden sm:flex items-center gap-1 text-xs font-code text-muted-foreground">
              <span className="border rounded px-1 py-0.5">Ctrl</span>
              <span className="border rounded px-1 py-0.5">K</span>
            </div>
          </div>
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
    </nav>
  );
}

export default Header;
