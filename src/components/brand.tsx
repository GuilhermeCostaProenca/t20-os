import { cn } from "@/lib/utils";

type BrandProps = {
  className?: string;
  subtle?: boolean;
};

export function Brand({ className, subtle }: BrandProps) {
  return (
    <div
      className={cn(
        "group relative inline-flex items-center gap-3 font-semibold tracking-[0.14em]",
        className
      )}
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/70 via-primary to-[#6b1220] opacity-80 blur-md transition duration-300 group-hover:opacity-100" />
        <div className="relative flex h-11 w-11 items-center justify-center rounded-lg border border-primary/40 bg-gradient-to-br from-primary/80 via-primary to-[#6b1220] text-lg font-black text-primary-foreground shadow-[0_10px_34px_rgba(226,69,69,0.35)] ring-1 ring-primary/60">
          T20
        </div>
      </div>
      <div className="leading-tight">
        <span className="text-xs uppercase text-muted-foreground">Tormenta</span>
        <span
          className={cn(
            "block text-xl font-black text-foreground transition duration-200",
            subtle ? "opacity-80" : "opacity-100 group-hover:opacity-100"
          )}
        >
          OS
        </span>
      </div>
    </div>
  );
}
