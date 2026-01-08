import { prisma } from "@/lib/prisma";
import { NpcCreateSchema } from "@/lib/validators";
import { ZodError } from "zod";

type Context = { params: { id: string } | Promise<{ id: string }> };

function missingId() {
  const message = "Parametro id obrigatorio.";
  return Response.json({ error: message, message }, { status: 400 });
}

export async function GET(_req: Request, { params }: Context) {
  let id = "";
  try {
    ({ id } = await Promise.resolve(params));
    if (!id) return missingId();

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!campaign) {
      const message = "Campanha nao encontrada.";
      return Response.json({ error: message, message }, { status: 404 });
    }

    const npcs = await prisma.npc.findMany({
      where: { campaignId: id },
      orderBy: { updatedAt: "desc" },
    });

    return Response.json({ data: npcs });
  } catch (error) {
    console.error(`GET /api/campaigns/${id || "unknown"}/npcs`, error);
    const message = "Nao foi possivel listar NPCs.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: Context) {
  let id = "";
  try {
    ({ id } = await Promise.resolve(params));
    if (!id) return missingId();
    const payload = await req.json();
    const parsed = NpcCreateSchema.parse(payload);

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!campaign) {
      const message = "Campanha nao encontrada.";
      return Response.json({ error: message, message }, { status: 404 });
    }

    const npc = await prisma.npc.create({
      data: {
        campaignId: id,
        name: parsed.name,
        type: parsed.type ?? "npc",
        hpMax: parsed.hpMax,
        defenseFinal: parsed.defenseFinal ?? 10,
        damageFormula: parsed.damageFormula ?? "1d6",
        description: parsed.description,
        tags: parsed.tags,
        imageUrl: parsed.imageUrl,
      },
    });

    return Response.json({ data: npc }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues.map((issue) => issue.message).join(", ");
      return Response.json({ error: message, message }, { status: 400 });
    }
    console.error(`POST /api/campaigns/${id || "unknown"}/npcs`, error);
    const message = "Nao foi possivel criar o NPC.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}