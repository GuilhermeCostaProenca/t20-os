import type { ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { Shell } from "@/components/shell";
import { Topbar } from "@/components/topbar";
import { SessionProvider } from "@/components/session/session-context";
import { CortexProvider } from "@/components/ai/cortex-provider";
import { CortexSheet } from "@/components/ai/cortex-sheet";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <CortexProvider>
        <div className="relative min-h-screen">
          <div className="flex min-h-screen">
            <AppSidebar />
            <div className="flex-1">
              <Topbar />
              <main>
                <Shell className="pt-6" fluid>{children}</Shell>
              </main>
            </div>
          </div>
          <CortexSheet />
        </div>
      </CortexProvider>
    </SessionProvider>
  );
}
