"use client";

import { useEffect, useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Search, Skull, Shield, Heart, MoreVertical, Trash } from "lucide-react";
import { RevealButton } from "@/components/reveal-button";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

export default function WorldNpcsPage() {
    const params = useParams();
    const worldId = params?.id as string;
    const [npcs, setNpcs] = useState<any[]>([]);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [createOpen, setCreateOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        campaignId: "",
        hpMax: 10,
        defenseFinal: 10,
        description: "",
        tags: "",
        type: "npc" // or enemy
    });

    useEffect(() => {
        loadData();
    }, [worldId]);

    async function loadData() {
        try {
            setLoading(true);
            const [npcsRes, campaignsRes] = await Promise.all([
                fetch(`/api/npcs?worldId=${worldId}`),
                fetch(`/api/worlds/${worldId}`) // Fetch world to get campaigns
            ]);

            const npcsData = await npcsRes.json();
            const worldData = await campaignsRes.json();

            setNpcs(npcsData.data || []);
            setCampaigns(worldData.data?.campaigns || []);

            // Default campaign selection
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
            const res = await fetch("/api/npcs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    hpMax: Number(formData.hpMax),
                    defenseFinal: Number(formData.defenseFinal),
                    worldId
                })
            });
            if (!res.ok) throw new Error("Erro ao criar NPC");

            setCreateOpen(false);
            setFormData({ ...formData, name: "", description: "", tags: "" });
            loadData();
        } catch (err) {
            alert("Falha ao criar NPC");
        }
    }

    const filteredNpcs = npcs.filter(n =>
        n.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.tags?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Bestiário & NPCs</h1>
                    <p className="text-muted-foreground">Gerencie criaturas e personagens do mestre.</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nome ou tag..."
                            className="pl-8 bg-black/20 border-white/10"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Novo NPC
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Criar Novo NPC</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nome</label>
                                    <Input
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">PV Máximo</label>
                                        <Input
                                            type="number"
                                            required
                                            value={formData.hpMax}
                                            onChange={e => setFormData({ ...formData, hpMax: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Defesa</label>
                                        <Input
                                            type="number"
                                            required
                                            value={formData.defenseFinal}
                                            onChange={e => setFormData({ ...formData, defenseFinal: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Campanha</label>
                                    <select
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 bg-black/40"
                                        value={formData.campaignId}
                                        onChange={(e) => setFormData({ ...formData, campaignId: e.target.value })}
                                    >
                                        <option value="" disabled>Selecione...</option>
                                        {campaigns.map((c: any) => (
                                            <option key={c.id} value={c.id} className="bg-zinc-900">{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Tags (separadas por vírgula)</label>
                                    <Input
                                        placeholder="Goblin, Humano, Chefe..."
                                        value={formData.tags}
                                        onChange={e => setFormData({ ...formData, tags: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Descrição</label>
                                    <Textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                <Button type="submit" className="w-full">Criar Besta</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full" />)}
                </div>
            ) : filteredNpcs.length === 0 ? (
                <div className="text-center py-20 opacity-50 border border-dashed border-white/10 rounded-xl">
                    Nada encontrado. O mundo está seguro... por enquanto.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredNpcs.map(npc => (
                        <Card key={npc.id} className="bg-white/5 border-white/10 hover:border-primary/30 transition-colors group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Skull className="h-4 w-4 text-primary" />
                                    {npc.name}
                                </CardTitle>
                                <div className="flex items-center gap-1">
                                    <RevealButton
                                        type="NPC"
                                        title={npc.name}
                                        content={npc.description || ""}
                                        campaigns={campaigns}
                                    />
                                    <Badge variant="outline" className="text-[10px] uppercase">{npc.type}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xs text-muted-foreground mb-4 line-clamp-2 min-h-[2.5em]">
                                    {npc.description || "Sem descrição."}
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-1 text-green-400">
                                        <Heart className="h-3 w-3" />
                                        <span>{npc.hpMax} PV</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-blue-400">
                                        <Shield className="h-3 w-3" />
                                        <span>{npc.defenseFinal} Def</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-0 pb-3 text-[10px] text-muted-foreground flex justify-between">
                                <span className="truncate max-w-[120px]">{npc.campaign?.name}</span>
                                <span className="opacity-50 group-hover:opacity-100 uppercase tracking-widest">{npc.tags}</span>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
