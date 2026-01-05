import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "chrome-panel relative flex flex-col items-center justify-center gap-4 rounded-2xl px-6 py-10 text-center",
        className
      )}
    >
      {icon ? (
        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 text-primary shadow-[0_10px_30px_rgba(226,69,69,0.3)]">
          {icon}
        </div>
      ) : null}
      <div className="space-y-1">
        <p className="text-lg font-semibold tracking-[0.08em] uppercase">
          {title}
        </p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
