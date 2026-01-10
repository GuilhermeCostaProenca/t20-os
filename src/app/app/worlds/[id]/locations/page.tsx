"use client";

import { useEffect, useState, FormEvent } from "react";
import { useParams } from "next/navigation";
import { Plus, MapPin, FileText, Image as ImageIcon } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export default function WorldLocationsPage() {
    const params = useParams();
    const worldId = params?.id as string;
    const [items, setItems] = useState<any[]>([]);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);

    // Form
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [activeTab, setActiveTab] = useState("text");

    useEffect(() => {
        loadData();
    }, [worldId]);

    async function loadData() {
        setLoading(true);
        try {
            const [res, worldRes] = await Promise.all([
                fetch(`/api/ruleset-docs?worldId=${worldId}&type=LOCATION`),
                fetch(`/api/worlds/${worldId}`)
            ]);
            const payload = await res.json();
            const worldPayload = await worldRes.json();

            setItems(payload.data || []);
            setCampaigns(worldPayload.data?.campaigns || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    // ... handleCreate ...

    // ... (skipping handleCreate implementation in this replacement block, handled by context match if I match carefully)
    // Wait, I can't skip handleCreate easily if I replace loadData which is far above Card.
    // MultiReplace is better, or just replace the whole file? No, risky.
    // I will split this into 2 replacements.
    // 1. Logic (State + LoadData).
    // 2. JSX (Card).


    async function handleCreate(e: FormEvent) {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append("worldId", worldId);
            formData.append("title", title);
            formData.append("type", "LOCATION");

            if (activeTab === "text") {
                formData.append("content", content);
            } else if (file) {
                formData.append("file", file);
            } else {
                return;
            }

            const res = await fetch("/api/ruleset-docs", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Erro ao criar");

            setCreateOpen(false);
            setTitle("");
            setContent("");
            setFile(null);
            loadData();
        } catch (err) {
            alert("Falha ao salvar local");
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Locais Importantes</h1>
                    <p className="text-muted-foreground">Mapas, descrições e pontos de interesse.</p>
                </div>
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Novo Local
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Registrar Local</DialogTitle>
                        </DialogHeader>
                        <Tabs defaultValue="text" value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="text">Descrição</TabsTrigger>
                                <TabsTrigger value="file">Arquivo / Mapa</TabsTrigger>
                            </TabsList>
                            <form onSubmit={handleCreate} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nome do Local</label>
                                    <Input required value={title} onChange={e => setTitle(e.target.value)} />
                                </div>

                                <TabsContent value="text" className="space-y-2">
                                    <label className="text-sm font-medium">Conteúdo (Markdown)</label>
                                    <Textarea
                                        required={activeTab === 'text'}
                                        className="min-h-[150px]"
                                        value={content}
                                        onChange={e => setContent(e.target.value)}
                                    />
                                </TabsContent>

                                <TabsContent value="file" className="space-y-2">
                                    <label className="text-sm font-medium">Imagem ou PDF</label>
                                    <Input
                                        type="file"
                                        required={activeTab === 'file'}
                                        onChange={e => setFile(e.target.files?.[0] || null)}
                                    />
                                </TabsContent>

                                <Button type="submit" className="w-full">Salvar</Button>
                            </form>
                        </Tabs>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map(item => (
                    <Card key={item.id} className="bg-white/5 border-white/10 overflow-hidden hover:border-primary/30 transition-colors group">
                        {item.filePath.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                            <div className="h-32 w-full bg-black/50 relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={item.filePath} alt={item.title} className="object-cover w-full h-full opacity-75 group-hover:opacity-100 transition-opacity" />
                            </div>
                        ) : (
                            <div className="h-32 w-full bg-white/5 flex items-center justify-center">
                                <MapPin className="h-10 w-10 text-muted-foreground/50" />
                            </div>
                        )}
                        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-base truncate flex-1 mr-2">{item.title}</CardTitle>
                            <RevealButton
                                type={item.filePath.match(/\.(jpg|jpeg|png|webp)$/i) ? "IMAGE" : "LOCATION"}
                                title={item.title}
                                imageUrl={item.filePath.match(/\.(jpg|jpeg|png|webp)$/i) ? item.filePath : undefined}
                                campaigns={campaigns}
                            />
                        </CardHeader>
                        <CardFooter className="p-4 pt-0">
                            <Button variant="link" className="p-0 h-auto text-xs text-muted-foreground" onClick={() => window.open(item.filePath, '_blank')}>
                                Abrir Documento
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
                {items.length === 0 && !loading && (
                    <div className="col-span-full py-12 text-center text-muted-foreground">
                        Nenhum local registrado ainda.
                    </div>
                )}
            </div>
        </div>
    );
}
