"use client";

import { useEffect, useState, FormEvent } from "react";
import { useParams } from "next/navigation";
import { Plus, Calendar, Clock, BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export default function WorldDiaryPage() {
    const params = useParams();
    const worldId = params?.id as string;
    const [sessions, setSessions] = useState<any[]>([]);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);

    // Form
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        campaignId: "",
        scheduledAt: "",
        status: "planned"
    });

    useEffect(() => {
        loadData();
    }, [worldId]);

    async function loadData() {
        setLoading(true);
        try {
            const [sessionsRes, campaignsRes] = await Promise.all([
                fetch(`/api/sessions?worldId=${worldId}`),
                fetch(`/api/worlds/${worldId}`)
            ]);

            const sessionsData = await sessionsRes.json();
            const worldData = await campaignsRes.json();

            setSessions(sessionsData.data || []);
            setCampaigns(worldData.data?.campaigns || []);

            if (worldData.data?.campaigns?.length > 0) {
                setFormData(prev => ({ ...prev, campaignId: worldData.data.campaigns[0].id }));
            }

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(e: FormEvent) {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                worldId,
                scheduledAt: formData.scheduledAt ? new Date(formData.scheduledAt).toISOString() : undefined
            };

            const res = await fetch("/api/sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Erro ao criar");

            setCreateOpen(false);
            setFormData({ ...formData, title: "", description: "" });
            loadData();
        } catch (err) {
            alert("Falha ao agendar sessão");
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Diário de Sessões</h1>
                    <p className="text-muted-foreground">O registro histórico das aventuras.</p>
                </div>
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Agendar Sessão
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Nova Sessão</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Título</label>
                                <Input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Campanha</label>
                                {/* Native select to be safe */}
                                <select
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 bg-black/40"
                                    value={formData.campaignId}
                                    onChange={(e) => setFormData({ ...formData, campaignId: e.target.value })}
                                >
                                    {campaigns.map((c: any) => (
                                        <option key={c.id} value={c.id} className="bg-zinc-900">{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Data/Hora</label>
                                <Input
                                    type="datetime-local"
                                    onChange={e => setFormData({ ...formData, scheduledAt: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Resumo / Notas Iniciais</label>
                                <Textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <Button type="submit" className="w-full">Agendar</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="space-y-4">
                {sessions.map(session => (
                    <Card key={session.id} className="bg-white/5 border-white/10 hover:border-primary/30 transition-colors">
                        <CardHeader className="flex flex-row items-start justify-between pb-2">
                            <div>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <span className="text-muted-foreground font-normal">#{session.campaign?.name}</span>
                                    {session.title}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                    <Calendar className="h-3 w-3" />
                                    {session.scheduledAt ? new Date(session.scheduledAt).toLocaleDateString() : "Sem data"}
                                    <Clock className="h-3 w-3 ml-2" />
                                    {session.scheduledAt ? new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                                </p>
                            </div>
                            <Badge variant={session.status === 'finished' ? "secondary" : session.status === 'active' ? "default" : "outline"}>
                                {session.status}
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {session.description || "Sem descrição."}
                            </p>
                        </CardContent>
                    </Card>
                ))}
                {sessions.length === 0 && !loading && (
                    <div className="py-12 text-center text-muted-foreground">
                        Nenhuma sessão registrada.
                    </div>
                )}
            </div>
        </div>
    );
}
