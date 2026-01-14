"use client";

import { Shell } from "@/components/shell";
import { Users, WifiOff } from "lucide-react";

export default function CommunityPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center mb-4">
                <Users className="w-10 h-10 text-white/40" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">
                Rede de Agentes
            </h1>
            <p className="text-muted-foreground max-w-md">
                Buscando sinal criptografado...
                <br />
                <span className="text-red-500 text-sm uppercase tracking-widest font-bold mt-2 flex items-center justify-center gap-2">
                    <WifiOff className="w-4 h-4" /> Sem Conexão
                </span>
            </p>
        </div>
    );
}
