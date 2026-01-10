"use client";

import { useEffect, useState, FormEvent } from "react";
import { useParams } from "next/navigation";
import { Plus, Book, FileText } from "lucide-react";

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

export default function WorldCompendiumPage() {
    const params = useParams();
    const worldId = params?.id as string;
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);

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
            const res = await fetch(`/api/ruleset-docs?worldId=${worldId}&type=RULE`); // Filter by RULE
            const payload = await res.json();
            setItems(payload.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(e: FormEvent) {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append("worldId", worldId);
            formData.append("title", title);
            formData.append("type", "RULE"); // Force type

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
            alert("Falha ao salvar regra");
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Compêndio</h1>
                    <p className="text-muted-foreground">Livros, regras da casa e documentos.</p>
                </div>
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Nova Regra
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Adicionar ao Compêndio</DialogTitle>
                        </DialogHeader>
                        <Tabs defaultValue="text" value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="text">Texto</TabsTrigger>
                                <TabsTrigger value="file">PDF / Arquivo</TabsTrigger>
                            </TabsList>
                            <form onSubmit={handleCreate} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Título</label>
                                    <Input required value={title} onChange={e => setTitle(e.target.value)} />
                                </div>

                                <TabsContent value="text" className="space-y-2">
                                    <label className="text-sm font-medium">Conteúdo</label>
                                    <Textarea
                                        required={activeTab === 'text'}
                                        className="min-h-[150px]"
                                        value={content}
                                        onChange={e => setContent(e.target.value)}
                                    />
                                </TabsContent>

                                <TabsContent value="file" className="space-y-2">
                                    <label className="text-sm font-medium">Arquivo</label>
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

            <div className="grid grid-cols-1 gap-4">
                {items.map(item => (
                    <Card key={item.id} className="bg-white/5 border-white/10 hover:border-primary/30 transition-colors flex flex-row items-center p-4">
                        <div className="h-10 w-10 flex items-center justify-center bg-white/10 rounded-lg mr-4">
                            <Book className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                            <div className="font-semibold">{item.title}</div>
                            <div className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => window.open(item.filePath, '_blank')}>
                            Abrir
                        </Button>
                    </Card>
                ))}
                {items.length === 0 && !loading && (
                    <div className="py-12 text-center text-muted-foreground">
                        O compêndio está vazio.
                    </div>
                )}
            </div>
        </div>
    );
}
