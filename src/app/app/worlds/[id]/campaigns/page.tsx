"use client";

import { useEffect, useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Search, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import { CampaignCreateSchema } from "@/lib/validators";

type Campaign = {
    id: string;
    name: string;
    description?: string;
    system: string;
    updatedAt: string;
    world: { title: string };
};

const initialForm = {
    name: "",
    description: "",
};

export default function WorldCampaignsPage() {
    const params = useParams();
    const worldId = params?.id as string;
    const router = useRouter();

    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Creation State
    const [dialogOpen, setDialogOpen] = useState(false);
    const [form, setForm] = useState(initialForm);
    const [formError, setFormError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (worldId) {
            loadCampaigns();
        }
    }, [worldId]);

    async function loadCampaigns() {
        setLoading(true);
        try {
            const res = await fetch(`/api/campaigns?worldId=${worldId}`, { cache: "no-store" });
            const payload = await res.json();
            if (res.ok) {
                setCampaigns(payload.data ?? []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(event?: FormEvent<HTMLFormElement>) {
        event?.preventDefault();
        setFormError(null);
        const parsed = CampaignCreateSchema.safeParse(form);
        if (!parsed.success) {
            setFormError(parsed.error.issues[0]?.message ?? "Dados inválidos");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/campaigns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...parsed.data, worldId }),
            });
            const payload = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(payload.error ?? "Não foi possível criar a campanha");
            }

            setForm(initialForm);
            setDialogOpen(false);
            await loadCampaigns();
        } catch (err) {
            const message = err instanceof Error ? err.message : "Erro ao salvar";
            setFormError(message);
        } finally {
            setSubmitting(false);
        }
    }

    const filtered = campaigns.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Campanhas</h1>
                    <p className="text-muted-foreground">Gerencie as campanhas deste mundo.</p>
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="shadow-[0_0_24px_rgba(226,69,69,0.35)]">
                            <Plus className="mr-2 h-4 w-4" />
                            Nova Campanha
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="chrome-panel flex max-h-[85vh] w-[95vw] max-w-xl flex-col overflow-hidden border-white/10 bg-card/80 p-0 text-left backdrop-blur">
                        <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
                            <DialogTitle>Nova Campanha</DialogTitle>
                            <DialogDescription>
                                Crie uma nova saga dentro deste mundo.
                            </DialogDescription>
                        </DialogHeader>
                        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleCreate}>
                            <div className="flex-1 space-y-4 overflow-y-auto px-6 pb-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Nome</label>
                                    <Input
                                        placeholder="Ex.: A Lenda de Ruff Ghanor"
                                        value={form.name}
                                        onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Descrição</label>
                                    <Textarea
                                        placeholder="Breve resumo..."
                                        value={form.description}
                                        onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                                        rows={4}
                                    />
                                </div>
                                {formError && <p className="text-sm text-destructive">{formError}</p>}
                            </div>
                            <div className="shrink-0 border-t border-white/10 px-6 py-4 flex justify-end gap-2">
                                <Button variant="ghost" type="button" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? "Criando..." : "Criar Campanha"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar campanhas..."
                        className="pl-9 bg-white/5 border-white/10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-40 animate-pulse rounded-xl bg-white/5" />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-muted-foreground">
                    <p>Nenhuma campanha encontrada.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((campaign) => (
                        <Link key={campaign.id} href={`/app/campaign/${campaign.id}`} className="group block">
                            <Card className="h-full border-white/10 bg-white/5 transition-colors hover:border-primary/50 hover:bg-white/10">
                                <CardHeader>
                                    <CardTitle className="truncate">{campaign.name}</CardTitle>
                                    <CardDescription className="line-clamp-2">
                                        {campaign.description || "Sem descrição."}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <Badge variant="secondary" className="bg-black/40">{campaign.system}</Badge>
                                        <span>{new Date(campaign.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
