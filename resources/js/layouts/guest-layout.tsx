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
        <div className={cn('grow mx-auto w-full flex flex-col items-start px-2 md:px-8', fullWidth ? '' : 'max-w-4xl')}>
            {children}
        </div>
    </div>
);
