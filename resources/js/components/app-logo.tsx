import { home } from '@/routes';
import AppLogoIcon from './app-logo-icon';
import { Link } from '@inertiajs/react';

export default function AppLogo() {
    return (
        <Link href={home()} prefetch className="flex items-center gap-2">
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
            </div>
            <div className="grid flex-1 text-left text-sm">
                <span className="truncate leading-tight font-semibold">
                    Fizzy Docs
                </span>
            </div>
        </Link>
    );
}
