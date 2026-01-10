"use client";

import { Eye, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface RevealButtonProps {
    type: "NPC" | "LOCATION" | "IMAGE";
    title: string;
    content?: string;
    imageUrl?: string;
    campaigns: { id: string; name: string; roomCode?: string }[];
}

export function RevealButton({ type, title, content, imageUrl, campaigns }: RevealButtonProps) {
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    async function handleReveal(roomCode: string) {
        if (!roomCode) {
            alert("Campanha sem código de sala.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/reveal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomCode,
                    type,
                    title,
                    content,
                    imageUrl,
                    visibility: "players",
                    expiresAt: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 mins
                }),
            });

            if (!res.ok) {
                throw new Error("Falha ao revelar");
            }

            setOpen(false);
            // alert("Revelado com sucesso!"); 
        } catch (error) {
            alert("Erro ao revelar para jogadores");
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <Button variant="ghost" size="icon" disabled><Loader2 className="h-4 w-4 animate-spin" /></Button>
    }

    if (campaigns.length === 0) {
        return <Button variant="ghost" size="icon" disabled title="Nenhuma campanha ativa"><Eye className="h-4 w-4 opacity-50" /></Button>
    }

    // Single campaign: Direct action
    if (campaigns.length === 1) {
        return (
            <Button
                variant="ghost"
                size="icon"
                className="hover:text-primary hover:bg-primary/10"
                title={`Revelar para ${campaigns[0].name}`}
                onClick={() => handleReveal(campaigns[0].roomCode || "")}
            >
                <Eye className="h-4 w-4" />
            </Button>
        )
    }

    // Multiple campaigns: Dialog selection
    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="hover:text-primary hover:bg-primary/10"
                onClick={() => setOpen(true)}
            >
                <Eye className="h-4 w-4" />
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Revelar para qual campanha?</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-2 py-4">
                        {campaigns.map(c => (
                            <Button
                                key={c.id}
                                variant="outline"
                                className="justify-start"
                                onClick={() => handleReveal(c.roomCode || "")}
                            >
                                {c.name}
                            </Button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
