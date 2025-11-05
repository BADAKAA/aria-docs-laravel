import Header from '@/components/guest-header';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';

interface AppLayoutProps {
    children: ReactNode;
    fullWidth?: boolean;
    breadcrumbs?: BreadcrumbItem[];
}


export default ({ children, breadcrumbs, fullWidth = false, ...props }: AppLayoutProps) => (
    <div className="flex flex-col min-h-screen">
        <Header />
        <main className={cn('h-auto scroll-smooth flex flex-col', fullWidth ? 'grow' : 'sm:container mx-auto w-[90vw]')}>
            {children}
        </main>
    </div>
);
