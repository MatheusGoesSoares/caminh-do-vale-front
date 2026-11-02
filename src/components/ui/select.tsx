import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, placeholder, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-[#123A24]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              "h-9 w-full appearance-none rounded-lg border border-[#BFE3C8]/50 bg-white px-3 pr-9 text-sm text-[#123A24] transition-colors duration-150",
              "focus:border-[#1F8A4D] focus:outline-none focus:ring-2 focus:ring-[#1F8A4D]/20",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "motion-reduce:transition-none",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B7264]"
            aria-hidden="true"
          />
        </div>
      </div>
    );
  }
);
Select.displayName = "Select";
