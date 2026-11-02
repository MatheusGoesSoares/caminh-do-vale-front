import type { LucideIcon } from "lucide-react";
import { PackageOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = PackageOpen,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-6 text-center",
        className
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E6F4EA]">
        <Icon className="h-7 w-7 text-[#1F8A4D]" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-[#123A24]">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-[#5B7264]">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
