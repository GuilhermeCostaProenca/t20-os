import { prisma } from "@/lib/prisma";
import { CombatStartSchema } from "@/lib/validators";
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

    const combat = await prisma.combat.findUnique({
      where: { campaignId: id },
      include: {
        combatants: true,
        events: {
          orderBy: { ts: "desc" },
          take: 50,
        },
      },
    });
    return Response.json({ data: combat });
  } catch (error) {
    console.error("GET /api/campaigns/[id]/combat", error);
    const message = "Nao foi possivel carregar o combate.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}

export async function POST(_req: Request, { params }: Context) {
  let id = "";
  try {
    ({ id } = await Promise.resolve(params));
    if (!id) return missingId();

    CombatStartSchema.parse({ campaignId: id });
    const combat = await prisma.combat.upsert({
      where: { campaignId: id },
      update: { isActive: true },
      create: { campaignId: id },
    });
    return Response.json({ data: combat }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues.map((i) => i.message).join(", ");
      return Response.json({ error: message, message }, { status: 400 });
    }
    console.error("POST /api/campaigns/[id]/combat", error);
    const message = "Nao foi possivel iniciar o combate.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Context) {
  let id = "";
  try {
    ({ id } = await Promise.resolve(params));
    if (!id) return missingId();

    const combat = await prisma.combat.update({
      where: { campaignId: id },
      data: { isActive: false },
    });
    return Response.json({ data: combat });
  } catch (error) {
    console.error("DELETE /api/campaigns/[id]/combat", error);
    const message = "Nao foi possivel encerrar o combate.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}