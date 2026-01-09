import { prisma } from "@/lib/prisma";
import { summarizeSession } from "@/lib/summarize";
import { appendWorldEventFromSessionEvent } from "@/lib/world-events";
import { ZodError, z } from "zod";

type Context = { params: { id: string } | Promise<{ id: string }> };

function missingId() {
  const message = "Parametro id obrigatorio.";
  return Response.json({ error: message, message }, { status: 400 });
}

const BodySchema = z.object({
  campaignId: z.string().trim().optional(),
  events: z.array(z.any()).optional(),
});

export async function POST(req: Request, { params }: Context) {
  let id = "";
  try {
    ({ id } = await Promise.resolve(params));
    if (!id) return missingId();
    const payload = await req.json();
    const parsed = BodySchema.parse(payload ?? {});

    const combatEvents = parsed.campaignId
      ? await prisma.combatEvent.findMany({
          where: { combat: { campaignId: parsed.campaignId } },
          orderBy: { ts: "desc" },
          take: 100,
        })
      : [];

    const campaign = parsed.campaignId
      ? await prisma.campaign.findUnique({
          where: { id: parsed.campaignId },
          select: { worldId: true },
        })
      : null;

    const summary = summarizeSession([...(combatEvents as any[]), ...((parsed.events as any[]) ?? [])]);

    if (!campaign?.worldId) {
      const message = "Nao foi possivel determinar o mundo da campanha.";
      return Response.json({ error: message, message }, { status: 400 });
    }

    const saved = await prisma.sessionSummary.create({
      data: {
        sessionId: id,
        campaignId: parsed.campaignId,
        worldId: campaign.worldId,
        summary: summary.summary,
        highlights: summary.highlights,
        npcs: summary.npcs,
        items: summary.items,
        hooks: summary.hooks,
      },
    });

    const sessionEvents = (parsed.events as any[]) ?? [];
    await Promise.all(
      sessionEvents.map((event) =>
        appendWorldEventFromSessionEvent(event, {
          worldId: campaign?.worldId,
          campaignId: parsed.campaignId,
          sessionId: id,
        })
      )
    );

    return Response.json({ data: saved, generated: summary });
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues.map((i) => i.message).join(", ");
      return Response.json({ error: message, message }, { status: 400 });
    }
    console.error("POST /api/sessions/[id]/summarize", error);
    const message = "Falha ao gerar resumo.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}
