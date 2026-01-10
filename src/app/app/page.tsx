"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus, Sparkles, Swords } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CampaignCreateSchema } from "@/lib/validators";

type Campaign = {
  id: string;
  name: string;
  description?: string | null;
  system: string;
  createdAt: string;
  updatedAt: string;
  world?: {
    id: string;
    title: string;
  } | null;
};

const initialForm = {
  name: "",
  description: "",
};


export default function DashboardPage() {
  const router = useRouter();
  const [worlds, setWorlds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorlds();
  }, []);

  async function loadWorlds() {
    try {
      const res = await fetch("/api/worlds");
      const json = await res.json();
      if (res.ok) setWorlds(json.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Mesa de Jogo</h1>
          <p className="text-muted-foreground">Selecione um mundo para jogar ou mestrar.</p>
        </div>
        <Button onClick={() => router.push("/app/worlds")} variant="outline" className="border-primary/30 text-primary">
          <Sparkles className="mr-2 h-4 w-4" />
          Gerenciar Mundos
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Create World Card Trigger */}
        <div
          onClick={() => router.push("/app/worlds")}
          className="group flex cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 transition-colors hover:border-primary/50 hover:bg-primary/5"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
            <Plus className="h-6 w-6" />
          </div>
          <span className="font-semibold text-primary">Novo Mundo</span>
        </div>

        {/* World Cards */}
        {loading ? (
          [1, 2].map(i => <div key={i} className="h-64 animate-pulse rounded-3xl bg-white/5" />)
        ) : worlds.map(world => (
          <div key={world.id} onClick={() => router.push(`/app/worlds/${world.id}`)} className="cursor-pointer group relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 hover:border-primary/50 transition-all">
            {/* Cover Image Placeholder */}
            <div className="h-32 w-full bg-gradient-to-b from-primary/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />

            <div className="p-6">
              <div className="mb-2 flex items-center justify-between">
                <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-[10px] tracking-widest uppercase">
                  {world.role || "GM"}
                </Badge>
                {world.status === 'ACTIVE' && <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_limegreen]" />}
              </div>
              <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{world.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {world.description || "Um vasto mundo de aventuras..."}
              </p>

              <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground/60">
                <span className="flex items-center gap-1">
                  <Swords className="h-3 w-3" /> {world.campaigns?.length || 0} Campanhas
                </span>
                <span className="flex items-center gap-1">
                  <ArrowRight className="h-3 w-3" /> Acessar
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}



