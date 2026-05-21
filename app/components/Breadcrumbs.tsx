import LocalizedLink from './LocalizedLink';
import type { PathWithoutLocale } from '../i18n/routing';

export interface BreadcrumbItem {
  label: string;
  href?: PathWithoutLocale;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500 list-none m-0 p-0">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {index > 0 && (
                <span aria-hidden className="text-gray-400">
                  /
                </span>
              )}
              {item.href && !isLast ? (
                <LocalizedLink href={item.href} className="hover:text-burgundy transition-colors">
                  {item.label}
                </LocalizedLink>
              ) : (
                <span className={isLast ? 'text-dark font-medium' : undefined} aria-current={isLast ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
