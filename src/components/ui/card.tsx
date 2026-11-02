import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "bordered";
}

const variantStyles: Record<string, string> = {
  default: "bg-white border border-[#E6F4EA] shadow-sm",
  elevated: "bg-white shadow-md",
  bordered: "bg-white border border-[#BFE3C8]",
};

export function Card({
  variant = "default",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn("rounded-xl p-5", variantStyles[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mb-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-sm font-semibold text-[#123A24]", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  );
}
