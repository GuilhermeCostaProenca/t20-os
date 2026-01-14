import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SessionDialog } from "@/components/session/session-dialog";
import { CortexInput } from "@/components/ai/cortex-input";
import { Brand } from "./brand";

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-gradient-to-b from-black/80 via-[#0b0b14]/80 to-transparent backdrop-blur-2xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 gap-4">
        <div className="flex items-center gap-4 shrink-0">
          <Brand subtle />
          <Badge className="border-primary/25 bg-primary/10 text-primary hidden md:flex">
            Mesa do Gui
          </Badge>
        </div>

        <div className="flex-1 max-w-md mx-auto">
          <CortexInput />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-primary/40 text-primary hover:bg-primary/10 hidden sm:flex"
          >
            <Link href="/">Landing</Link>
          </Button>
          <SessionDialog />
        </div>
      </div>
    </header>
  );
}
