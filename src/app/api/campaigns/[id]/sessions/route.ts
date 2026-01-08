import { prisma } from "@/lib/prisma";
import { SessionCreateSchema } from "@/lib/validators";
import { ZodError } from "zod";

type Context = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Context) {
  let id = "";
  try {
    ({ id } = await params);
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!campaign) {
      return Response.json({ error: "Campanha nao encontrada." }, { status: 404 });
    }

    const sessions = await prisma.session.findMany({
      where: { campaignId: id },
      orderBy: { updatedAt: "desc" },
    });

    return Response.json({ data: sessions });
  } catch (error) {
    console.error(`GET /api/campaigns/${id || "unknown"}/sessions`, error);
    return Response.json({ error: "Nao foi possivel listar sessoes." }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: Context) {
  let id = "";
  try {
    ({ id } = await params);
    const payload = await req.json();
    const parsed = SessionCreateSchema.parse(payload);

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!campaign) {
      return Response.json({ error: "Campanha nao encontrada." }, { status: 404 });
    }

    const session = await prisma.session.create({
      data: {
        campaignId: id,
        title: parsed.title,
        description: parsed.description,
        coverUrl: parsed.coverUrl,
        scheduledAt: parsed.scheduledAt ? new Date(parsed.scheduledAt) : null,
      },
    });

    return Response.json({ data: session }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: error.issues.map((issue) => issue.message).join(", ") },
        { status: 400 }
      );
    }
    console.error(`POST /api/campaigns/${id || "unknown"}/sessions`, error);
    return Response.json({ error: "Nao foi possivel criar a sessao." }, { status: 500 });
  }
}
