import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

function sanitizeExtension(ext: string) {
  const cleaned = ext.replace(/[^a-zA-Z0-9.]/g, "");
  return cleaned || ".bin";
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      const message = "Arquivo invalido.";
      return Response.json({ error: message, message }, { status: 400 });
    }

    if (file.type && !file.type.startsWith("image/")) {
      const message = "Envie apenas imagens.";
      return Response.json({ error: message, message }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const extFromName = path.extname(file.name || "");
    const extFromType = file.type ? `.${file.type.split("/")[1]}` : "";
    const ext = sanitizeExtension(extFromName || extFromType || ".png");
    const filename =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? `${crypto.randomUUID()}${ext}`
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, filename), buffer);

    return Response.json({ url: `/uploads/${filename}` }, { status: 201 });
  } catch (error) {
    console.error("POST /api/upload", error);
    const message = "Nao foi possivel enviar o arquivo.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}
