import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const term = (searchParams.get("term") || "").trim();
  const rulesetId = searchParams.get("rulesetId") || undefined;

  if (!term) {
    return Response.json({ data: [] });
  }

  const docs = await prisma.rulesetDocument.findMany({
    where: {
      AND: [
        rulesetId ? { rulesetId } : {},
        {
          OR: [
            { title: { contains: term, mode: "insensitive" } },
            { textIndex: { contains: term, mode: "insensitive" } },
          ],
        },
      ],
    },
    take: 20,
    orderBy: { createdAt: "desc" },
  });

  const results = docs.map((doc) => {
    const idx = doc.textIndex?.toLowerCase().indexOf(term.toLowerCase()) ?? -1;
    const snippet =
      idx >= 0 && doc.textIndex
        ? doc.textIndex.substring(Math.max(0, idx - 40), Math.min(doc.textIndex.length, idx + 80))
        : null;
    return { ...doc, snippet, page: 1 };
  });

  return Response.json({ data: results });
}
