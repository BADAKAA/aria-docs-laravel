import { buttonVariants } from '@/components/ui/button';
import GuestLayout from '@/layouts/guest-layout';
import { Head, Link } from '@inertiajs/react';

export default function Welcome() {
    return (
        <GuestLayout fullWidth>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>
            <div className='flex flex-col sm:items-center justify-center m-auto'>
                <a
                    href="https://github.com/BADAKAA/aria-docs-laravel"
                    target="_blank"
                    rel="noreferrer"
                    className="mb-5 sm:text-lg flex items-center gap-2 underline underline-offset-4 sm:-mt-12"
                >
                    Follow along on GitHub ↗
                </a>
                <h1 className="text-[1.80rem] leading-8 sm:px-8 md:leading-[4.5rem] font-bold mb-4 sm:text-6xl text-left sm:text-center !text-foreground text-balance">
                    Effortlessly build stunning documentation sites with flexibility for
                    diverse projects.
                </h1>
                <p className="mb-8 md:text-lg text-base max-w-[1200px] text-muted-foreground text-left sm:text-center">
                    This feature-packed documentation template, built with multiple
                    frameworks including Next.js, React Router, and TanStack Router, offers
                    a sleek and responsive design, perfect for all your project
                    documentation needs.
                </p>
                <div className="sm:flex sm:flex-row grid grid-cols-2 items-center gap-3 sm:gap-5 mb-8">
                    <Link href="/docs"
                        className={buttonVariants({ className: "px-6", size: "lg" })}
                    >
                        Get Started
                    </Link>
                    <Link href="/blog"
                        className={buttonVariants({
                            variant: "secondary",
                            className: "px-6",
                            size: "lg",
                        })}>
                        Read Blog
                    </Link>
                </div>
                <span className="sm:flex hidden items-start gap-2 text-muted-foreground mt-5 -mb-12 max-[800px]:mb-12 font-code sm:text-base text-sm font-medium">
                    ⌘ php artisan migrate --seed
                </span>
                <div className="hidden h-4 lg:block"></div>
            </div>

        </GuestLayout>
    );
}