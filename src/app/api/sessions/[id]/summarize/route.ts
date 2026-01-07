import { prisma } from "@/lib/prisma";
import { summarizeSession } from "@/lib/summarize";
import { ZodError, z } from "zod";

type Context = { params: { id: string } };

const BodySchema = z.object({
  campaignId: z.string().trim().optional(),
  events: z.array(z.any()).optional(),
});

export async function POST(req: Request, { params }: Context) {
  try {
    const payload = await req.json();
    const parsed = BodySchema.parse(payload ?? {});

    const combatEvents = parsed.campaignId
      ? await prisma.combatEvent.findMany({
          where: { combat: { campaignId: parsed.campaignId } },
          orderBy: { ts: "desc" },
          take: 100,
        })
      : [];

    const summary = summarizeSession([...(combatEvents as any[]), ...((parsed.events as any[]) ?? [])]);

    const saved = await prisma.sessionSummary.create({
      data: {
        sessionId: params.id,
        campaignId: parsed.campaignId,
        summary: summary.summary,
        highlights: summary.highlights,
        npcs: summary.npcs,
        items: summary.items,
        hooks: summary.hooks,
      },
    });

    return Response.json({ data: saved, generated: summary });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: error.issues.map((i) => i.message).join(", ") }, { status: 400 });
    }
    console.error("POST /api/sessions/[id]/summarize", error);
    return Response.json({ error: "Falha ao gerar resumo" }, { status: 500 });
  }
}
