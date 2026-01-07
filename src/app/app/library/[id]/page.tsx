import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PageProps = { params: { id: string } };

async function getDoc(id: string) {
  return prisma.rulesetDocument.findUnique({ where: { id } });
}

export default async function LibraryDocPage({ params }: PageProps) {
  const doc = await getDoc(params.id);
  if (!doc) return notFound();
  const pageParam = 1;
  const src = `${doc.filePath}#page=${pageParam}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-primary">Documento</p>
          <h1 className="text-3xl font-bold">{doc.title}</h1>
          <p className="text-muted-foreground">
            <Badge variant="outline" className="mr-2">
              {doc.rulesetId}
            </Badge>
            {doc.type} • {doc.pages ? `${doc.pages} paginas` : "paginas nao informadas"}
          </p>
        </div>
      </div>

      <Card className="chrome-panel border-white/10 bg-card/70">
        <CardHeader>
          <CardTitle>Visualização</CardTitle>
          <CardDescription>PDF incorporado com paginacao do visor nativo.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-[4/3] w-full overflow-hidden rounded-lg border border-white/10 bg-black/40">
            <embed src={src} type="application/pdf" className="h-full w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
