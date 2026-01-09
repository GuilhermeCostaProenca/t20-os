"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenText,
  Globe2,
  LayoutDashboard,
  MapPin,
  NotebookPen,
  ShieldHalf,
  Sparkles,
  UserCircle2,
} from "lucide-react";

// ... imports
import { cn } from "@/lib/utils";
import { extractWorldIdFromPath } from "@/lib/active-world";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Brand } from "./brand";

const baseNavItems = [
  { id: "mesa", href: "/app", label: "Mesa", icon: LayoutDashboard },
  { id: "mundos", href: "/app/worlds", label: "Mundos", icon: Globe2 },
];

const worldNavItems = [
  { id: "hub", path: "", label: "Visão Geral", icon: LayoutDashboard }, // Changed Mesa to Hub
  { id: "campaigns", path: "campaigns", label: "Campanhas", icon: ShieldHalf },
  { id: "characters", path: "characters", label: "Personagens", icon: UserCircle2 },
  { id: "npcs", path: "npcs", label: "NPCs", icon: UserCircle2 }, // Icon overlap?
  { id: "locations", path: "locations", label: "Locais", icon: MapPin },
  { id: "compendium", path: "compendium", label: "Compêndio", icon: BookOpenText },
  { id: "diary", path: "diary", label: "Diário", icon: NotebookPen },
];

export function AppSidebar() {
  const pathname = usePathname();
  const worldId = extractWorldIdFromPath(pathname);
  const isInWorld = worldId !== null;

  // Rule 1: Outside world => Mesa, Mundos only.
  // Rule 2: Inside world => World Scoped links only.
  const navItems = isInWorld
    ? worldNavItems.map((item) => ({
      id: item.id,
      href: item.path === "" ? `/app/worlds/${worldId}` : `/app/worlds/${worldId}/${item.path}`,
      label: item.label,
      icon: item.icon,
    }))
    : baseNavItems;

  return (
    <aside className="hidden lg:block relative z-20">
      <div className="sticky top-0 flex h-screen w-[250px] flex-col justify-between border-r border-white/10 bg-sidebar/95 px-5 py-6 backdrop-blur-xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Brand className="text-sm" />
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              {isInWorld ? "Mundo" : "Sistema"}
            </Badge>
          </div>
          <Separator className="border-white/10" />

          <nav className="space-y-2">
            {navItems.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/app" && item.href !== `/app/worlds/${worldId}` && pathname.startsWith(item.href)); // Exact match for root, prefix for others?

              const Icon = item.icon;

              return (
                <Button
                  asChild
                  key={item.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 rounded-xl border border-transparent text-sm font-medium transition duration-200",
                    active
                      ? "border-primary/30 bg-primary/10 text-primary shadow-[0_0_15px_rgba(226,69,69,0.15)]"
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

        {!isInWorld && (
          <div className="chrome-panel rounded-2xl p-4">
            {/* Global Promo or User Info */}
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary/80">
              <Sparkles className="h-3 w-3" />
              T20 OS Alpha
            </div>
            <p className="text-xs text-muted-foreground">
              Selecione um mundo para começar.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
