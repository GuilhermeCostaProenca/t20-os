import { prisma } from "@/lib/prisma";
import { CharacterUpdateSchema } from "@/lib/validators";
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
    const parsed = CharacterUpdateSchema.parse(payload);

    const existing = await prisma.character.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      const message = "Personagem nao encontrado.";
      return Response.json({ error: message, message }, { status: 404 });
    }

    const updated = await prisma.character.update({
      where: { id },
      data: {
        name: parsed.name,
        ancestry: parsed.ancestry ?? null,
        className: parsed.className ?? null,
        role: parsed.role,
        description: parsed.description ?? null,
        avatarUrl: parsed.avatarUrl ?? null,
        level: parsed.level,
      },
    });

    return Response.json({ data: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues.map((issue) => issue.message).join(", ");
      return Response.json({ error: message, message }, { status: 400 });
    }
    console.error("PUT /api/characters/[id]", error);
    const message = "Nao foi possivel atualizar o personagem.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Context) {
  let id = "";
  try {
    ({ id } = await Promise.resolve(params));
    if (!id) return missingId();
    const existing = await prisma.character.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      const message = "Personagem nao encontrado.";
      return Response.json({ error: message, message }, { status: 404 });
    }

    await prisma.character.delete({ where: { id } });
    return Response.json({ data: { id } });
  } catch (error) {
    console.error("DELETE /api/characters/[id]", error);
    const message = "Nao foi possivel remover o personagem.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}
