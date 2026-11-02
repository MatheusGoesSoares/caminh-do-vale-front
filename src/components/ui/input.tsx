import { forwardRef, type InputHTMLAttributes } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  search?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, search, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[#123A24]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {search && (
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B7264]"
              aria-hidden="true"
            />
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "h-9 w-full rounded-lg border border-[#BFE3C8]/50 bg-white px-3 text-sm text-[#123A24] placeholder:text-[#5B7264] transition-colors duration-150",
              "focus:border-[#1F8A4D] focus:outline-none focus:ring-2 focus:ring-[#1F8A4D]/20",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "motion-reduce:transition-none",
              search && "pl-9",
              error && "border-[#D94F4F] focus:border-[#D94F4F] focus:ring-[#D94F4F]/20",
              className
            )}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-[#D94F4F]" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
