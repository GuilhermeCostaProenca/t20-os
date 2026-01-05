import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type ShellProps = {
  children: ReactNode;
  className?: string;
};

export function Shell({ children, className }: ShellProps) {
  return (
    <div className="relative w-full">
      <div className="pointer-events-none absolute inset-6 rounded-[32px] border border-white/5 bg-gradient-to-b from-white/5 via-transparent to-transparent opacity-60 blur-3xl" />
      <div
        className={cn(
          "relative mx-auto w-full max-w-6xl px-6 pb-14 pt-6",
          "backdrop-blur-xl",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
