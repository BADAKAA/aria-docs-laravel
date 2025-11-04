import { router } from '@inertiajs/react';
import React, { useMemo } from 'react';

const MAX_NEIGHBORING_PAGES_SHOWN = 2;

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginationData {
    current_page: number;
    last_page: number;
    links: PaginationLink[];
}

export type PaginationAlign = 'left' | 'center' | 'right';

export default function Pagination({
    data,
    align = 'center',
    border = false,
    prevent = false,
    tabName = '',
    onPageChanged,
}: {
    data: PaginationData;
    align?: PaginationAlign;
    border?: boolean;
    prevent?: boolean;
    tabName?: string;
    onPageChanged?: (info: { page: number; url: string | null }) => void;
}) {
    const currentPage = data?.current_page;

    const links = useMemo(() => {
        return (data?.links ?? []).filter((l) => l.label !== '...');
    }, [data]);

    const justify = align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center w-full';

    const getPageNumber = (label: string): number => {
        const parsed = parseInt(label, 10);
        if (!Number.isNaN(parsed)) return parsed;
        const lower = label.toLowerCase();
        if (lower.includes('prev')) return currentPage - 1;
        if (lower.includes('next')) return currentPage + 1;
        return currentPage;
    };

    const arrowHidden = (label: string): boolean => {
        const lower = label.toLowerCase();
        if (lower.includes('prev') && currentPage === 1) return true;
        if (lower.includes('next') && currentPage === data.last_page) return true;
        return false;
    };

    const isHidden = (label: string): boolean => {
        const pageNumber = parseInt(label, 10);
        const isArrow = Number.isNaN(pageNumber);
        if (align !== 'center' && isArrow && arrowHidden(label)) return true;
        if (isArrow) return false;
        return (
            Math.abs(pageNumber - currentPage) > MAX_NEIGHBORING_PAGES_SHOWN &&
            pageNumber > 1 &&
            pageNumber < data.last_page
        );
    };

    const isEllipsisIndex = (label: string, i: number): boolean => {
        const pageNumber = getPageNumber(label);
        if (i === 0 || i === links.length - 1 || !isHidden(label)) return false;
        const lastPageNumber = getPageNumber(links[i - 1].label);
        if (lastPageNumber === 1 && pageNumber !== 1) return true;
        const nextPageNumber = getPageNumber(links[i + 1].label);
        if (nextPageNumber === data.last_page && pageNumber !== data.last_page) return true;
        return false;
    };

    const changePage = (link: PaginationLink, index: number) => (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        const page = getPageNumber(link.label);
        onPageChanged?.({ page, url: link.url });
        const visitData: Record<string, unknown> = {};
        if (tabName) visitData.open = tabName;
        if (!prevent && link.url) {
            router.visit(link.url, { data: visitData, preserveScroll: true });
        }
    };

    if (!data || data.last_page <= 1) return null;

    return (
        <div className={`flex items-center gap-2 py-4 ${justify}`} role="navigation" aria-label="Pages">
            {links.map((link, i) => {
                const hidden = isHidden(link.label) && !isEllipsisIndex(link.label, i);
                const opacity0 = arrowHidden(link.label);
                const disabled = arrowHidden(link.label) || isEllipsisIndex(link.label, i);
                const showEllipsis = isEllipsisIndex(link.label, i);
                const middleItem = ![0, links.length - 1].includes(i);
                const base = 'rounded-md p-2 w-8 h-8 flex items-center justify-center border border-border duration-300 transition-[background-color,color] hover:bg-foreground hover:text-muted';
                const bg = link.active
                    ? 'bg-foreground text-muted'
                    : middleItem && !showEllipsis
                      ? `bg-background ${border ? 'border' : ''}`
                      : '';

                return (
                    <a
                        key={`${link.label}-${i}`}
                        href={link.url ?? '#'}
                        aria-label={`Go to page ${getPageNumber(link.label)}`}
                        className={`${base} ${bg} ${opacity0 ? 'opacity-0' : ''} ${hidden ? 'hidden' : ''} ${disabled ? 'pointer-events-none' : ''}`}
                        onClick={changePage(link, i)}
                    >
                        {i === 0 ? (
                            <span>{'<'}</span>
                        ) : i === links.length - 1 ? (
                            <span>{'>'}</span>
                        ) : showEllipsis ? (
                            <span>…</span>
                        ) : (
                            <span>{link.label}</span>
                        )}
                    </a>
                );
            })}
        </div>
    );
}
