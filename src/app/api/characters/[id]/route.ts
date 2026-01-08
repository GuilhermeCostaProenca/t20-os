import { prisma } from "@/lib/prisma";
import { CharacterUpdateSchema } from "@/lib/validators";
import { ZodError } from "zod";

type Context = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Context) {
  let id = "";
  try {
    ({ id } = await params);
    const payload = await req.json();
    const parsed = CharacterUpdateSchema.parse(payload);

    const existing = await prisma.character.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return Response.json({ error: "Personagem nao encontrado." }, { status: 404 });
    }

    const updated = await prisma.character.update({
      where: { id },
      data: {
        name: parsed.name,
        role: parsed.role,
        description: parsed.description ?? null,
        avatarUrl: parsed.avatarUrl ?? null,
        level: parsed.level,
      },
    });

    return Response.json({ data: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: error.issues.map((issue) => issue.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("PUT /api/characters/[id]", error);
    return Response.json({ error: "Nao foi possivel atualizar o personagem." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Context) {
  let id = "";
  try {
    ({ id } = await params);
    const existing = await prisma.character.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return Response.json({ error: "Personagem nao encontrado." }, { status: 404 });
    }

    await prisma.character.delete({ where: { id } });
    return Response.json({ data: { id } });
  } catch (error) {
    console.error("DELETE /api/characters/[id]", error);
    return Response.json({ error: "Nao foi possivel remover o personagem." }, { status: 500 });
  }
}
