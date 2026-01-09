"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSession } from "./session-context";

type RecentBlock = {
  title: string;
  description: string;
  items: { label: string; badge?: string }[];
};

export function SessionRecents() {
  const { state } = useSession();

  const recentRolls = useMemo(
    () =>
      state.events
        .filter((e) => e.type === "ROLL")
        .slice(0, 3)
        .map((e) => ({
          label: e.message,
          badge: e.breakdown?.toHit ? `${e.breakdown.toHit.total}` : undefined,
        })),
    [state.events]
  );

  const recentNpcs = useMemo(
    () =>
      state.events
        .filter((e) => e.type === "NPC_MENTION")
        .slice(0, 3)
        .map((e) => ({ label: e.message, badge: "NPC" })),
    [state.events]
  );

  const blocks: RecentBlock[] = [
    {
      title: "NPCs recentes",
      description: "Últimos citados na mesa.",
      items:
        recentNpcs.length > 0
          ? recentNpcs
          : [
              { label: "Sem NPCs ainda", badge: undefined },
              { label: "Adicione no modo sessão", badge: undefined },
            ],
    },
    {
      title: "Itens recentes",
      description: "Placeholders para saques e relíquias.",
      items: [
        { label: "Espada de Valkaria", badge: "Raro" },
        { label: "Mapa da Tumba", badge: "Pista" },
        { label: "Amuleto rubro", badge: "Mágico" },
      ],
    },
    {
      title: "Últimas rolagens",
      description: "Resumo das jogadas marcantes.",
      items:
        recentRolls.length > 0
          ? recentRolls
          : [
              { label: "Sem rolagens ainda", badge: undefined },
              { label: "Use o modo sessão", badge: undefined },
            ],
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {blocks.map((block) => (
        <Card
          key={block.title}
          className="chrome-panel rounded-2xl border-white/10 bg-white/5"
        >
          <CardHeader>
            <CardTitle className="text-lg">{block.title}</CardTitle>
            <CardDescription>{block.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {block.items.map((item, idx) => (
              <div key={`${block.title}-${idx}`} className="flex justify-between">
                <span>{item.label}</span>
                {item.badge ? (
                  <Badge variant="outline" className="text-xs">
                    {item.badge}
                  </Badge>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
