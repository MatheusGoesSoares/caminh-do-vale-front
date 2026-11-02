import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtitle?: string;
  iconColor?: string;
  iconBg?: string;
  className?: string;
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  subtitle,
  iconColor = "text-[#1A7A44]",
  iconBg = "bg-[#E6F4EA]",
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "relative flex items-start gap-4 overflow-hidden rounded-xl border border-[#E6F4EA] bg-white p-5 shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      <span
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: "linear-gradient(90deg, #2FA866, #BFE3C8, #F2C94C, #F2994A)" }}
        aria-hidden="true"
      />
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          iconBg
        )}
        aria-hidden="true"
      >
        <Icon className={cn("h-5 w-5", iconColor)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-[#5B7264] truncate">{label}</p>
        <p className="mt-1 font-display text-2xl font-bold tracking-tight text-[#123A24]">
          {value}
        </p>
        {subtitle && (
          <p className="mt-0.5 text-xs text-[#5B7264] truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
