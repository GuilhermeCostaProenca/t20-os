import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LibrarySearch } from "@/components/library/library-search";

async function getDocs() {
  return prisma.rulesetDocument.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export default async function LibraryPage() {
  const docs = await getDocs();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-primary">Biblioteca</p>
          <h1 className="text-3xl font-bold">Documentos do sistema</h1>
          <p className="text-muted-foreground">PDFs por ruleset. Upload apenas para mestre (dev/local).</p>
        </div>
        <Link href="/app/library/upload">
          <Button className="shadow-[0_0_24px_rgba(226,69,69,0.35)]">Enviar PDF</Button>
        </Link>
      </div>

      <LibrarySearch />

      <div className="grid gap-4 lg:grid-cols-3">
        {docs.map((doc) => (
          <Link key={doc.id} href={`/app/library/${doc.id}`}>
            <Card className="chrome-panel border-white/10 bg-card/70 hover:border-primary/30 transition">
              <CardHeader>
                <CardTitle className="line-clamp-1">{doc.title}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Badge variant="outline">{doc.rulesetId}</Badge>
                  <span className="text-xs text-muted-foreground">{doc.type}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {doc.pages ? `${doc.pages} paginas` : "Paginas nao informadas"}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
        {docs.length === 0 ? (
          <Card className="chrome-panel border-white/10 bg-card/70">
            <CardContent className="py-10 text-center text-muted-foreground">Nenhum documento.</CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
