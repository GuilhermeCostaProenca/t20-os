import { prisma } from "@/lib/prisma";
import { CombatStartSchema } from "@/lib/validators";
import { ZodError } from "zod";

type Context = { params: { id: string } };

export async function GET(_req: Request, { params }: Context) {
  try {
    const combat = await prisma.combat.findUnique({
      where: { campaignId: params.id },
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
    return Response.json(
      { error: "Não foi possível carregar o combate." },
      { status: 500 }
    );
  }
}

export async function POST(_req: Request, { params }: Context) {
  try {
    CombatStartSchema.parse({ campaignId: params.id });
    const combat = await prisma.combat.upsert({
      where: { campaignId: params.id },
      update: { isActive: true },
      create: { campaignId: params.id },
    });
    return Response.json({ data: combat }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("POST /api/campaigns/[id]/combat", error);
    return Response.json(
      { error: "Não foi possível iniciar o combate." },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: Context) {
  try {
    const combat = await prisma.combat.update({
      where: { campaignId: params.id },
      data: { isActive: false },
    });
    return Response.json({ data: combat });
  } catch (error) {
    console.error("DELETE /api/campaigns/[id]/combat", error);
    return Response.json(
      { error: "Não foi possível encerrar o combate." },
      { status: 500 }
    );
  }
}
