import { buttonVariants } from "./ui/button";
import { CommandIcon, HeartIcon } from "lucide-react";
import AppLogoIcon from "./app-logo-icon";

export function Footer() {
  return (
    <footer className="border-t w-full h-16">
      <div className="container px-8 flex items-center sm:justify-between justify-center sm:gap-0 gap-4 h-full text-muted-foreground text-sm flex-wrap sm:py-0 py-3 max-sm:px-4">
        <div className="flex items-center gap-3">
          <CommandIcon className="sm:block hidden w-5 h-5 text-muted-foreground" />
          <p className="text-center">
            Build by{" "}
            <a
              target="_blank"
              className="px-1 underline underline-offset-2"
              href="https://github.com/BADAKAAhd"
            >
              BADAKAA
            </a>
            and
            <a
              target="_blank"
              className="px-1 underline underline-offset-2"
              href="https://github.com/nisabmohd"
            >
              nisabmohd
            </a>
            . The source code is available on{" "}
            <a
              target="_blank"
              className="px-1 underline underline-offset-2"
              href="https://github.com/BADAKAA/aria-docs-laravel"
            >
              GitHub
            </a>
            .
          </p>
        </div>

        <div className="gap-4 items-center hidden md:flex">
          <FooterButtons />
        </div>
      </div>
    </footer>
  );
}

export function FooterButtons() {
  return (
    <>
      <a
        target="_blank"
        href="https://laravel.com/docs/12.x/deployment"
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        <AppLogoIcon className="h-[0.8rem] w-4 mr-2 text-primary fill-current" />
        Deploy
      </a>
      <a
        target="_blank"
        href="https://www.paypal.com/donate?hosted_button_id=YURU8T2GGWBX4"
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        <HeartIcon className="h-4 w-4 mr-2 text-red-600 fill-current" />
        Sponsor
      </a>
    </>
  );
}
