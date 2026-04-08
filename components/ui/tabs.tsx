import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabsProps extends React.ComponentProps<"div"> {
  value: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function Tabs({
  value,
  onValueChange,
  className,
  children,
  ...props
}: TabsProps) {
  return (
    <div className={cn("w-full", className)} {...props}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            tabValue: value,
            onTabChange: onValueChange,
          });
        }
        return child;
      })}
    </div>
  );
}

export function TabsList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("flex gap-2", className)}>{children}</div>;
}

export function TabsTrigger({
  value,
  children,
  tabValue,
  onTabChange,
  className,
}: {
  value: string;
  children: React.ReactNode;
  tabValue?: string;
  onTabChange?: (v: string) => void;
  className?: string;
}) {
  const active = tabValue === value;
  return (
    <button
      type="button"
      className={cn(
        "px-4 py-2 rounded-lg font-semibold text-sm transition-colors",
        active
          ? "bg-[#1f8a65] text-white"
          : "bg-white/[0.04] text-white/60 hover:bg-white/[0.08]",
        className,
      )}
      onClick={() => onTabChange?.(value)}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  tabValue,
  children,
  className,
}: {
  value: string;
  tabValue?: string;
  children: React.ReactNode;
  className?: string;
}) {
  if (tabValue !== value) return null;
  return <div className={cn("mt-2", className)}>{children}</div>;
}
