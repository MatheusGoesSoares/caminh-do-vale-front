import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F8A4D] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none",
  {
    variants: {
      variant: {
        primary: "bg-[#1A7A44] text-white hover:bg-[#1A7A44]/90 active:bg-[#1A7A44]/80",
        secondary:
          "border border-[#1F8A4D] text-[#1F8A4D] bg-transparent hover:bg-[#E6F4EA] active:bg-[#BFE3C8]/20",
        ghost: "text-[#123A24] hover:bg-[#F4FAF5] active:bg-[#E6F4EA]",
        danger: "bg-[#D94F4F] text-white hover:bg-[#D94F4F]/90 active:bg-[#D94F4F]/80",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4 text-sm",
        lg: "h-11 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      ref={ref}
      {...props}
    />
  )
);
Button.displayName = "Button";
