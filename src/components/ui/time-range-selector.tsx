import type { TimeRange } from "@/types";
import { cn } from "@/lib/utils";

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  className?: string;
}

const options: { value: TimeRange; label: string }[] = [
  { value: "5m", label: "5min" },
  { value: "30m", label: "30min" },
  { value: "1h", label: "1h" },
  { value: "6h", label: "6h" },
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
];

export function TimeRangeSelector({
  value,
  onChange,
  className,
}: TimeRangeSelectorProps) {
  return (
    <div
      className={cn("inline-flex gap-1 rounded-lg bg-[#F4FAF5] p-1", className)}
      role="radiogroup"
      aria-label="Período de tempo"
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 motion-reduce:transition-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F8A4D]",
              isActive
                ? "bg-[#1A7A44] text-white shadow-sm"
                : "text-[#5B7264] hover:text-[#123A24] hover:bg-[#E6F4EA]"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
