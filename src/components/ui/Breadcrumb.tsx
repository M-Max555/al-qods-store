import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="مسار التنقل" className="flex items-center gap-1 text-sm flex-wrap">
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1">
          {index > 0 && (
            <ChevronLeft size={14} className="text-gray-300 rtl-flip" />
          )}
          {item.href && index < items.length - 1 ? (
            <Link
              to={item.href}
              className="text-gray-500 hover:text-red-600 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className={index === items.length - 1 ? 'text-gray-900 font-semibold' : 'text-gray-500'}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
