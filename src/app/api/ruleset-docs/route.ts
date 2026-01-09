import fs from "node:fs";
import path from "node:path";

import { prisma } from "@/lib/prisma";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rulesetId = searchParams.get("rulesetId") || undefined;
  const worldId = searchParams.get("worldId") || undefined;

  const where: Record<string, any> = {};
  if (rulesetId) {
    where.rulesetId = rulesetId;
  }
  if (worldId) {
    where.worldId = worldId;
  }

  const docs = await prisma.rulesetDocument.findMany({
    where: Object.keys(where).length ? where : undefined,
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ data: docs });
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const title = (form.get("title") as string | null)?.trim();
    const rulesetId = (form.get("rulesetId") as string | null)?.trim() || "tormenta20";
    const worldId = (form.get("worldId") as string | null)?.trim();
    const type = (form.get("type") as string | null)?.trim() || "pdf";
    const pagesRaw = form.get("pages") as string | null;
    const textIndex = (form.get("textIndex") as string | null) ?? undefined;

    if (!file || typeof file === "string") {
      const message = "Arquivo nao enviado.";
      return Response.json({ error: message, message }, { status: 400 });
    }
    if (!title) {
      const message = "Titulo e obrigatorio.";
      return Response.json({ error: message, message }, { status: 400 });
    }
    if (!worldId) {
      const message = "worldId e obrigatorio.";
      return Response.json({ error: message, message }, { status: 400 });
    }

    // Verify world exists
    const world = await prisma.world.findUnique({
      where: { id: worldId },
      select: { id: true },
    });
    if (!world) {
      const message = "Mundo nao encontrado.";
      return Response.json({ error: message, message }, { status: 404 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
    const targetPath = path.join(UPLOAD_DIR, safeName);
    await fs.promises.writeFile(targetPath, buffer);

    const pages = pagesRaw ? Number(pagesRaw) || null : null;

    const doc = await prisma.rulesetDocument.create({
      data: {
        rulesetId,
        worldId,
        title,
        type,
        pages: pages ?? undefined,
        textIndex: textIndex || undefined,
        storageKey: safeName,
        filePath: `/uploads/${safeName}`,
      },
    });

    return Response.json({ data: doc }, { status: 201 });
  } catch (error) {
    console.error("POST /api/ruleset-docs", error);
    const message = "Falha ao salvar documento.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}
