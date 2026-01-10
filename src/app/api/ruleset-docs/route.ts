import fs from "node:fs";
import path from "node:path";

import { prisma } from "@/lib/prisma";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rulesetId = searchParams.get("rulesetId") || undefined;
  const worldId = searchParams.get("worldId") || undefined;
  const type = searchParams.get("type") || undefined;

  const where: Record<string, any> = {};
  if (rulesetId) where.rulesetId = rulesetId;
  if (worldId) where.worldId = worldId;
  if (type) where.type = type;

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
    const content = form.get("content") as string | null;
    const title = (form.get("title") as string | null)?.trim();
    const rulesetId = (form.get("rulesetId") as string | null)?.trim() || "tormenta20";
    const worldId = (form.get("worldId") as string | null)?.trim();
    const type = (form.get("type") as string | null)?.trim() || "pdf";
    const pagesRaw = form.get("pages") as string | null;
    const textIndex = (form.get("textIndex") as string | null) ?? undefined;

    if (!title) {
      return Response.json({ error: "Titulo e obrigatorio" }, { status: 400 });
    }
    if (!worldId) {
      return Response.json({ error: "worldId e obrigatorio" }, { status: 400 });
    }

    let filePath = "";
    let storageKey = "";

    if (file && typeof file !== "string") {
      // Upload logic
      const f = file as File;
      const buffer = Buffer.from(await f.arrayBuffer());
      const filename = `${Date.now()}-${f.name.replace(/[^a-z0-9.]/gi, "_")}`;
      const targetPath = path.join(UPLOAD_DIR, filename);

      if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      }

      fs.writeFileSync(targetPath, buffer);
      filePath = `/uploads/${filename}`;
      storageKey = filename;
    } else if (content) {
      // Text/Markdown logic
      const filename = `${Date.now()}-${title.replace(/[^a-z0-9]/gi, "_")}.md`;
      const targetPath = path.join(UPLOAD_DIR, filename);

      if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      }

      fs.writeFileSync(targetPath, content);
      filePath = `/uploads/${filename}`;
      storageKey = filename;
    } else {
      return Response.json({ error: "Arquivo ou conteudo necessario" }, { status: 400 });
    }

    const created = await prisma.rulesetDocument.create({
      data: {
        rulesetId,
        worldId,
        title,
        type,
        filePath,
        storageKey,
        pages: pagesRaw ? parseInt(pagesRaw) : undefined,
        textIndex,
      },
    });

    return Response.json({ data: created });
  } catch (error) {
    console.error("POST /api/ruleset-docs", error);
    const message = "Nao foi possivel fazer upload.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}
