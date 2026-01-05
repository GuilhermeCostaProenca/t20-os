"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, LayoutDashboard, MapPin, NotebookPen, ShieldHalf, Sparkles, UserCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Brand } from "./brand";

const navItems = [
  { href: "/app", label: "Mesa", icon: LayoutDashboard },
  { href: "/app", label: "Personagens", icon: UserCircle2 },
  { href: "/app", label: "NPCs", icon: ShieldHalf },
  { href: "/app", label: "Locais", icon: MapPin },
  { href: "/app", label: "Compêndio", icon: BookOpenText },
  { href: "/app", label: "Diário", icon: NotebookPen },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-0 flex h-screen w-[250px] flex-col justify-between border-r border-white/10 bg-sidebar/80 px-5 py-6 backdrop-blur-xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Brand className="text-sm" />
            <Badge className="bg-primary/15 text-primary border-primary/30">
              Mesa
            </Badge>
          </div>
          <Separator className="border-white/10" />

          <nav className="space-y-2">
            {navItems.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/app" && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Button
                  asChild
                  key={item.href}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 rounded-xl border border-transparent text-sm font-medium transition duration-200",
                    active
                      ? "border-primary/30 bg-primary/15 text-primary shadow-[0_10px_30px_rgba(226,69,69,0.25)]"
                      : "text-muted-foreground hover:border-white/10 hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <Link href={item.href}>
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              );
            })}
          </nav>
        </div>

        <div className="chrome-panel rounded-2xl p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-primary">
            <Sparkles className="h-4 w-4" />
            Última sessão
          </div>
          <p className="text-sm text-muted-foreground">
            Sessão 12: batalha em Valkaria. Diário pronto para revisar.
          </p>
          <Button className="mt-4 w-full justify-center bg-primary text-primary-foreground shadow-[0_0_24px_rgba(226,69,69,0.35)]">
            Ver diário
          </Button>
        </div>
      </div>
    </aside>
  );
}
