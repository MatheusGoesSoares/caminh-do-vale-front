import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "success" | "warning" | "critical" | "info" | "neutral" | "muted";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-[#1F8A4D]/10 text-[#1F8A4D] border-[#1F8A4D]/20",
  warning: "bg-[#E08A2E]/10 text-[#E08A2E] border-[#E08A2E]/20",
  critical: "bg-[#D94F4F]/10 text-[#D94F4F] border-[#D94F4F]/20",
  info: "bg-[#427DA5]/10 text-[#427DA5] border-[#427DA5]/20",
  neutral: "bg-[#E6F4EA] text-[#123A24] border-[#BFE3C8]/30",
  muted: "bg-[#F4FAF5] text-[#5B7264] border-[#5B7264]/20",
};

export function Badge({ variant = "neutral", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium leading-5",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
