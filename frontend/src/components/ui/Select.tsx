import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => (
    <div className="relative w-full">
      <select
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-md border border-surface-300 bg-white px-3 py-2 text-sm text-surface-950 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-surface-100 disabled:text-surface-500 disabled:opacity-70",
          error && "border-red-500 focus:ring-red-500",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && (
        <span className="mt-1 block text-xs text-red-500">
          {error}
        </span>
      )}
    </div>
  )
);

Select.displayName = "Select";

export { Select };
