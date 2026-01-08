import { prisma } from "@/lib/prisma";
import { SessionUpdateSchema } from "@/lib/validators";
import { ZodError } from "zod";

type Context = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Context) {
  let id = "";
  try {
    ({ id } = await params);
    const payload = await req.json();
    const parsed = SessionUpdateSchema.parse(payload);

    const existing = await prisma.session.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return Response.json({ error: "Sessao nao encontrada." }, { status: 404 });
    }

    const updated = await prisma.session.update({
      where: { id },
      data: {
        title: parsed.title,
        description: parsed.description ?? null,
        coverUrl: parsed.coverUrl ?? null,
        scheduledAt: parsed.scheduledAt ? new Date(parsed.scheduledAt) : null,
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
    console.error("PUT /api/sessions/[id]", error);
    return Response.json({ error: "Nao foi possivel atualizar a sessao." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Context) {
  let id = "";
  try {
    ({ id } = await params);
    const existing = await prisma.session.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return Response.json({ error: "Sessao nao encontrada." }, { status: 404 });
    }

    await prisma.session.delete({ where: { id } });
    return Response.json({ data: { id } });
  } catch (error) {
    console.error("DELETE /api/sessions/[id]", error);
    return Response.json({ error: "Nao foi possivel remover a sessao." }, { status: 500 });
  }
}
