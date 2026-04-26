interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export default function LoadingSpinner({ size = 'md', className = '', text }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        className={`${sizes[size]} border-red-200 border-t-red-600 rounded-full animate-spin`}
        role="status"
        aria-label="جاري التحميل"
      />
      {text && <p className="text-gray-500 text-sm">{text}</p>}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
          <div className="skeleton aspect-square" />
          <div className="p-4 space-y-2">
            <div className="skeleton h-3 w-1/3 rounded-full" />
            <div className="skeleton h-4 w-full rounded-full" />
            <div className="skeleton h-4 w-2/3 rounded-full" />
            <div className="skeleton h-5 w-1/2 rounded-full mt-3" />
          </div>
        </div>
      ))}
    </div>
  );
}
