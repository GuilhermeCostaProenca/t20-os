"use client";

import { Shell } from "@/components/shell";
import { BookOpenText, Construction } from "lucide-react";

export default function CompendiumPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center mb-4">
                <BookOpenText className="w-10 h-10 text-white/40" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">
                Arquivos da Ordem
            </h1>
            <p className="text-muted-foreground max-w-md">
                O acesso à base de dados de rituais e criaturas está restrito.
                <br />
                <span className="text-primary text-sm uppercase tracking-widest font-bold mt-2 block">
                    Nível de Acesso Insuficiente
                </span>
            </p>
        </div>
    );
}
