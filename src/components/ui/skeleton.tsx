import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-[#E6F4EA] motion-reduce:animate-none motion-reduce:opacity-70",
        className
      )}
      style={style}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 3, className }: SkeletonProps & { lines?: number }) {
  return (
    <div className={cn("space-y-2.5", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === lines - 1 ? "w-3/4" : "w-full")}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[#E6F4EA] bg-white p-5",
        className
      )}
      aria-hidden="true"
    >
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  );
}

export function SkeletonChart({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[#E6F4EA] bg-white p-5",
        className
      )}
      aria-hidden="true"
    >
      <Skeleton className="mb-4 h-4 w-40" />
      <div className="flex items-end gap-1.5 h-48">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t"
            style={{ height: `${30 + Math.random() * 60}%` }}
          />
        ))}
      </div>
    </div>
  );
}
