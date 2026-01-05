import Link from "next/link";
import { ArrowRight, BookOpenText, NotebookPen, Sparkles, Swords } from "lucide-react";

import { Brand } from "@/components/brand";
import { Shell } from "@/components/shell";
import { SessionRecents } from "@/components/session/session-recents";
import { SessionProvider } from "@/components/session/session-context";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const quickActions = [
  {
    title: "Continuar última campanha",
    description: "Retomar do ponto onde paramos na última sessão.",
    icon: Sparkles,
    cta: "Ir para campanha",
  },
  {
    title: "Iniciar sessão",
    description: "Criar notas, marcar iniciativas e registrar rolagens.",
    icon: Swords,
    cta: "Abrir sessão",
  },
  {
    title: "Abrir Compêndio",
    description: "Pesquisar criaturas, itens e referências de regras.",
    icon: BookOpenText,
    cta: "Ver compêndio",
  },
  {
    title: "Diário da campanha",
    description: "Ler resumos de sessões e próximos ganchos.",
    icon: NotebookPen,
    cta: "Ver diário",
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(226,69,69,0.2),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(143,108,245,0.18),transparent_26%)] opacity-70" />
      <Shell className="relative space-y-20 pt-16">
        <section className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-8">
            <Badge className="border-primary/30 bg-primary/10 text-primary">
              Sala da guilda
            </Badge>
            <div className="space-y-4">
              <h1 className="text-4xl font-black leading-tight sm:text-5xl">
                Bem-vindo de volta, Gui.
              </h1>
              <p className="text-lg text-muted-foreground sm:max-w-xl">
                Hub privado da mesa: continue a campanha, comece uma sessão ou
                abra o diário da guilda. Tudo com o clima de Tormenta 20.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                className="h-12 gap-3 rounded-xl bg-primary text-primary-foreground text-base shadow-[0_12px_38px_rgba(226,69,69,0.35)]"
              >
                <Link href="/app">
                  Continuar campanha
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 gap-2 rounded-xl border-primary/30 bg-white/5 text-primary shadow-inner shadow-black/40 backdrop-blur"
              >
                <Link href="#atalhos">
                  Iniciar sessão
                  <Swords className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_rgba(226,69,69,0.5)]" />
                Mesa em andamento hoje
              </span>
              <span className="hidden h-4 w-px bg-white/10 sm:block" />
              <span>Campanha, sessões e diário organizados para o grupo.</span>
            </div>
          </div>

          <Card className="chrome-panel relative overflow-hidden rounded-3xl border-white/10 bg-gradient-to-b from-white/5 to-transparent">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <Brand />
                <Badge className="border-white/10 bg-white/5 text-xs text-muted-foreground">
                  Mesa privada
                </Badge>
              </div>
              <CardTitle className="text-2xl">
                Tormenta 20 OS para a nossa mesa.
              </CardTitle>
              <CardDescription className="text-base">
                Continuar campanhas, iniciar sessões e manter o diário da guilda
                sempre à mão.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                  <span>Mesa de Arton</span>
                  <Badge className="bg-primary/15 text-primary border-primary/30">
                    Em andamento
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                  <span>Sessão pronta</span>
                  <Badge className="bg-primary/15 text-primary border-primary/30">
                    Hoje à noite
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                  <span>Diário da guilda</span>
                  <Badge variant="outline" className="text-muted-foreground">
                    Atualizado
                  </Badge>
                </div>
              </div>
              <Separator className="border-white/10" />
              <p className="text-sm text-muted-foreground">
                Espaço privado para organizar a campanha com visual Tormenta 20.
              </p>
            </CardContent>
          </Card>
        </section>

        <section id="atalhos" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-primary">
                Atalhos rápidos
              </p>
              <h2 className="text-2xl font-bold">Entre direto na ação</h2>
            </div>
            <Badge className="border-primary/25 bg-primary/10 text-primary">
              Mesa de Arton
            </Badge>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Card
                  key={action.title}
                  className="chrome-panel rounded-2xl border-white/10 bg-white/5 transition duration-200 hover:-translate-y-1 hover:border-primary/25"
                >
                  <CardHeader className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge className="border-primary/25 bg-primary/10 text-primary">
                        {action.cta}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-primary">
                Recentes
              </p>
              <h2 className="text-2xl font-bold">O que rolou na mesa</h2>
            </div>
          </div>
          <SessionProvider>
            <SessionRecents />
          </SessionProvider>
        </section>

        <section className="chrome-panel rounded-3xl border-white/10 bg-white/5 p-8 lg:p-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.18em] text-primary">
                Painel da guilda
              </p>
              <h3 className="text-2xl font-bold">Mesa íntima com clima T20.</h3>
              <p className="max-w-2xl text-muted-foreground">
                Continue a campanha, marque sessões e mantenha NPCs, itens e
                rolagens organizados em um só lugar.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 rounded-2xl border border-primary/30 bg-primary/10 px-6 py-5 text-primary shadow-[0_0_30px_rgba(226,69,69,0.25)]">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em]">
                <Sparkles className="h-4 w-4" />
                Próxima sessão
              </div>
              <p className="text-primary-foreground/80">
                Sessão 12: preparar encontro na praça de Valkaria e revisar o
                diário.
              </p>
              <Button asChild className="mt-2 bg-primary text-primary-foreground">
                <Link href="/app">
                  Continuar preparando
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </Shell>
    </div>
  );
}
