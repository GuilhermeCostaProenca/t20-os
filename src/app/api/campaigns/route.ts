import { prisma } from "@/lib/prisma";
import { CampaignCreateSchema } from "@/lib/validators";
import { ZodError } from "zod";

export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { updatedAt: "desc" },
    });

    return Response.json({ data: campaigns });
  } catch (error) {
    console.error("GET /api/campaigns", error);
    return Response.json(
      { error: "Não foi possível listar campanhas." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const parsed = CampaignCreateSchema.parse(payload);
    const rulesetId = parsed.rulesetId ?? "tormenta20";

    const campaign = await prisma.campaign.create({
      data: {
        name: parsed.name,
        description: parsed.description,
        rulesetId,
      },
    });

    return Response.json({ data: campaign }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: error.issues.map((issue) => issue.message).join(", ") },
        { status: 400 }
      );
    }

    console.error("POST /api/campaigns", error);
    return Response.json(
      { error: "Não foi possível criar a campanha." },
      { status: 500 }
    );
  }
}
