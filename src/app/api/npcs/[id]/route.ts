import { prisma } from "@/lib/prisma";
import { NpcUpdateSchema } from "@/lib/validators";
import { ZodError } from "zod";

type Context = { params: { id: string } | Promise<{ id: string }> };

function missingId() {
  const message = "Parametro id obrigatorio.";
  return Response.json({ error: message, message }, { status: 400 });
}

export async function PUT(req: Request, { params }: Context) {
  let id = "";
  try {
    ({ id } = await Promise.resolve(params));
    if (!id) return missingId();
    const payload = await req.json();
    const parsed = NpcUpdateSchema.parse(payload);

    const existing = await prisma.npc.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      const message = "NPC nao encontrado.";
      return Response.json({ error: message, message }, { status: 404 });
    }

    const updated = await prisma.npc.update({
      where: { id },
      data: {
        name: parsed.name,
        type: parsed.type ?? "npc",
        hpMax: parsed.hpMax,
        defenseFinal: parsed.defenseFinal ?? 10,
        damageFormula: parsed.damageFormula ?? "1d6",
        description: parsed.description ?? null,
        tags: parsed.tags ?? null,
        imageUrl: parsed.imageUrl ?? null,
      },
    });

    return Response.json({ data: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues.map((issue) => issue.message).join(", ");
      return Response.json({ error: message, message }, { status: 400 });
    }
    console.error("PUT /api/npcs/[id]", error);
    const message = "Nao foi possivel atualizar o NPC.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Context) {
  let id = "";
  try {
    ({ id } = await Promise.resolve(params));
    if (!id) return missingId();

    const existing = await prisma.npc.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      const message = "NPC nao encontrado.";
      return Response.json({ error: message, message }, { status: 404 });
    }

    await prisma.npc.delete({ where: { id } });
    return Response.json({ data: { id } });
  } catch (error) {
    console.error("DELETE /api/npcs/[id]", error);
    const message = "Nao foi possivel remover o NPC.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}