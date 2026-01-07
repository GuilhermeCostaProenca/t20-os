import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

async function getSummaries() {
  return prisma.sessionSummary.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export default async function DiarioPage() {
  const summaries = await getSummaries();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-primary">Diario</p>
        <h1 className="text-3xl font-bold">Resumos de sessao</h1>
        <p className="text-muted-foreground">Resumo heuristico do log de eventos. Preparado para IA futura.</p>
      </div>

      {summaries.length === 0 ? (
        <Card className="chrome-panel border-white/10 bg-card/70">
          <CardContent className="py-10 text-center text-muted-foreground">
            Nenhum resumo ainda. Gere via POST /api/sessions/[id]/summarize.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {summaries.map((s) => (
            <Card key={s.id} className="chrome-panel border-white/10 bg-card/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Sessao {s.sessionId}
                  {s.campaignId ? (
                    <Badge variant="outline" className="text-xs">
                      {s.campaignId}
                    </Badge>
                  ) : null}
                </CardTitle>
                <CardDescription>
                  {new Date(s.createdAt).toLocaleString("pt-BR")} - {Array.isArray(s.hooks) ? s.hooks.length : 0} ganchos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-relaxed text-foreground">{s.summary}</p>
                {Array.isArray(s.highlights) && s.highlights.length ? (
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Highlights</p>
                    <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                      {s.highlights.slice(0, 4).map((h: any, idx: number) => (
                        <li key={idx}>{String(h)}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {Array.isArray(s.hooks) && s.hooks.length ? (
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Proximos passos</p>
                    <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                      {s.hooks.slice(0, 3).map((h: any, idx: number) => (
                        <li key={idx}>{String(h)}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
