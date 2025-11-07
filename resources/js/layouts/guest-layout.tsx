import { Footer } from '@/components/footer';
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
    <div className="flex flex-col min-h-screen tracking-wide antialiased">
        <Header />
        <main className={cn('h-auto scroll-smooth flex flex-col', fullWidth ? 'grow px-4' : 'sm:container mx-auto w-[90vw]')}>
            {children}
        </main>
        <Footer />
    </div>
);
