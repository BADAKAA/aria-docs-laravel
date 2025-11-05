import { Link } from '@inertiajs/react';
import { buttonVariants } from '@/components/ui/button';
import { ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from 'lucide-react';

type PageLink = { title: string; href: string } | undefined;

export default function DocsPagination({ prev, next }: { prev: PageLink; next: PageLink }) {
  if (!prev && !next) return null;
  return (
  <div className="grid grid-cols-2 flex-grow sm:py-10 py-4 pt-5 gap-5">
      <div>
        {prev && (
          <Link
            className={buttonVariants({
              variant: 'outline',
              className:
                'no-underline w-full flex flex-col sm:pl-7 pl-3 sm:py-10 py-8 !items-start text-xs sm:text-sm',
            })}
            href={`/docs${prev.href}`}
          >
            <span className="flex items-center text-muted-foreground text-xs">
              <ChevronLeftIcon className="w-[1rem] h-[1rem] mr-1" />
              Previous
            </span>
            <span className="mt-1 ml-1">{prev.title}</span>
          </Link>
        )}
      </div>
      <div>
        {next && (
          <Link
            className={buttonVariants({
              variant: 'outline',
              className:
                'no-underline w-full flex flex-col sm:pr-7 pr-3 sm:py-10 py-8 !items-end text-xs sm:text-sm',
            })}
            href={`/docs${next.href}`}
          >
            <span className="flex items-center text-muted-foreground text-xs">
              Next
              <ChevronRightIcon className="w-[1rem] h-[1rem] ml-1" />
            </span>
            <span className="mt-1 mr-1">{next.title}</span>
          </Link>
        )}
      </div>
    </div>
  );
}
