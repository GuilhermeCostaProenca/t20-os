import { prisma } from "@/lib/prisma";
import { CharacterCreateSchema } from "@/lib/validators";
import { ZodError } from "zod";

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>;
};

function missingId() {
  const message = "Parametro id obrigatorio.";
  return Response.json({ error: message, message }, { status: 400 });
}

export async function GET(_req: Request, { params }: RouteContext) {
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

    const characters = await prisma.character.findMany({
      where: { campaignId: id },
      orderBy: { updatedAt: "desc" },
    });

    return Response.json({ data: characters });
  } catch (error) {
    console.error(`GET /api/campaigns/${id || "unknown"}/characters`, error);
    const message = "Nao foi possivel listar personagens.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: RouteContext) {
  let id = "";
  try {
    ({ id } = await Promise.resolve(params));
    if (!id) return missingId();

    const payload = await req.json();
    const parsed = CharacterCreateSchema.parse(payload);

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!campaign) {
      const message = "Campanha nao encontrada.";
      return Response.json({ error: message, message }, { status: 404 });
    }

    const character = await prisma.character.create({
      data: {
        name: parsed.name,
        role: parsed.role,
        description: parsed.description,
        avatarUrl: parsed.avatarUrl,
        level: parsed.level,
        campaignId: id,
      },
    });

    return Response.json({ data: character }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues.map((issue) => issue.message).join(", ");
      return Response.json({ error: message, message }, { status: 400 });
    }

    console.error(`POST /api/campaigns/${id || "unknown"}/characters`, error);
    const message = "Nao foi possivel criar o personagem.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}