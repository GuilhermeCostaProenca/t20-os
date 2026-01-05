import type { ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { Shell } from "@/components/shell";
import { Topbar } from "@/components/topbar";
import { SessionProvider } from "@/components/session/session-context";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <div className="relative min-h-screen">
        <div className="flex min-h-screen">
          <AppSidebar />
          <div className="flex-1">
            <Topbar />
            <main>
              <Shell className="pt-6">{children}</Shell>
            </main>
          </div>
        </div>
      </div>
    </SessionProvider>
  );
}
