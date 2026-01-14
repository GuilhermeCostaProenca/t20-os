"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Bell, Plus, Users as UsersIcon, X } from "lucide-react";
import { MissionCard } from "@/components/dashboard/mission-card";
import { AgentCard } from "@/components/dashboard/agent-card";
import { AgentTerminal } from "@/components/agent/agent-terminal";
import { OrdemSheet } from "@/components/sheet/ordem-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner"; // Using sonner for toasts

// Mock Data (Replace with API)
const MOCK_CAMPAIGNS = [
  {
    id: "m9ga6631qal4qs36irs8ps43",
    title: "A Ordem de Paranapiacaba",
    description: "Investigação de desaparecimentos misteriosos na neblina eterna da serra.",
    system: "T20",
    level: 3,
    playerCount: 4,
    status: "ONLINE",
    imageUrl: "https://i.pinimg.com/736x/2a/39/38/2a393816766444585c5443de27663152.jpg"
  },
  {
    id: "camp-2",
    title: "Protocolo Aranha",
    description: "Operação tática para conter brecha de contenção no subsolo de São Paulo.",
    system: "C.R.I.S.",
    level: 8,
    playerCount: 5,
    status: "OFFLINE",
    imageUrl: "https://i.pinimg.com/736x/85/e6/58/85e658ce5970222212903e6583949989.jpg"
  }
];

const MOCK_AGENTS = [
  { id: "char-1", name: "Dante", class: "Ocultista", level: 5, attributes: { str: 10, dex: 14, con: 12, int: 18, wis: 16, cha: 14 }, hp: { current: 24, max: 30 }, pm: { current: 15, max: 20 }, def: 15, avatarUrl: "https://i.pinimg.com/736x/8f/3e/60/8f3e60156d94225d36087798363673c6.jpg" },
  { id: "char-2", name: "Arthur C.", class: "Combatente", level: 6, attributes: { str: 18, dex: 14, con: 16, int: 10, wis: 12, cha: 10 }, hp: { current: 85, max: 85 }, pm: { current: 5, max: 10 }, def: 22, avatarUrl: "https://i.pinimg.com/736x/e4/65/57/e465578760927df87771746206037000.jpg" },
  { id: "char-3", name: "Kaiser", class: "Especialista", level: 5, attributes: { str: 10, dex: 16, con: 12, int: 18, wis: 14, cha: 12 }, hp: { current: 30, max: 35 }, pm: { current: 20, max: 20 }, def: 18, avatarUrl: "https://i.pinimg.com/736x/cc/95/96/cc95966c4296bb6b57958999719323ff.jpg" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [selectedAgent, setSelectedAgent] = useState<any>(null);

  // Real Data State
  const [worlds, setWorlds] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([loadWorlds(), loadAgents()]).finally(() => setLoading(false));
  }, []);

  async function loadWorlds() {
    try {
      const res = await fetch("/api/worlds");
      const json = await res.json();
      if (res.ok) setWorlds(json.data || []);
    } catch (e) {
      console.error("Failed to load worlds", e);
    }
  }

  async function loadAgents() {
    try {
      const res = await fetch("/api/characters?withSheet=true");
      const json = await res.json();
      if (res.ok) setAgents(json.data || []);
    } catch (e) {
      console.error("Failed to load agents", e);
    }
  }

  const handleEnterWorld = (worldId: string) => {
    router.push(`/app/worlds/${worldId}`);
  };

  return (
    <div className="space-y-12 relative pb-10">

      {/* Hero Section */}
      <section className="space-y-6">
        <div className="flex justify-between items-end border-b border-white/10 pb-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl font-bold tracking-tight text-white mb-2"
            >
              Painel de Controle
            </motion.h1>
            <p className="text-muted-foreground">
              Você tem <span className="text-primary font-bold">{worlds.length} mundos</span> e <span className="text-primary font-bold">{agents.length} agentes</span> conectados.
            </p>
          </div>
          <Button className="hidden md:flex bg-white text-black hover:bg-zinc-200 font-bold" onClick={() => router.push('/app/worlds')}>
            <Plus className="w-4 h-4 mr-2" />
            NOVO MUNDO
          </Button>
        </div>

        {/* Worlds Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            [1, 2, 3].map(i => <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse" />)
          ) : worlds.map((world, i) => (
            <motion.div key={world.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <MissionCard
                id={world.id}
                title={world.title}
                description={world.description || "Sem descrição."}
                system={world.system || "T20"}
                level={1}
                playerCount={world.campaigns?.length || 0}
                imageUrl={world.imageUrl || "https://i.pinimg.com/736x/2a/39/38/2a393816766444585c5443de27663152.jpg"}
                onPlay={() => handleEnterWorld(world.id)}
              />
            </motion.div>
          ))}

          {!loading && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="bg-zinc-900/30 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center p-8 cursor-pointer hover:bg-zinc-900/50 hover:border-primary/30 transition-all group h-64"
              onClick={() => router.push('/app/worlds')}
            >
              <div className="w-16 h-16 rounded-full bg-black/50 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Plus className="w-8 h-8 text-white/30 group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-white/50 group-hover:text-white">Criar Novo Mundo</h3>
            </motion.div>
          )}
        </div>
      </section>

      {/* Agents Reel section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold uppercase tracking-widest text-white/80 flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-primary" />
            Meus Dossiês
          </h2>
          <Button variant="link" className="text-primary text-xs uppercase font-bold">Ver todos</Button>
        </div>

        <ScrollArea className="w-full whitespace-nowrap pb-4">
          <div className="flex gap-4">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="w-64 h-80 flex-shrink-0 bg-white/5 rounded-xl animate-pulse" />)
            ) : agents.length === 0 ? (
              <div className="flex flex-col items-center justify-center w-full min-h-[200px] text-muted-foreground">
                <UsersIcon className="w-10 h-10 mb-2 opacity-20" />
                <p>Nenhum agente encontrado.</p>
              </div>
            ) : agents.map((char, i) => (
              <motion.div key={char.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + (i * 0.1) }}>
                <AgentCard
                  character={{
                    id: char.id,
                    name: char.name,
                    class: char.className || "Desconhecido",
                    level: char.level || 1,
                    attributes: char.attributes || {},
                    hp: char.stats?.hp || { current: 10, max: 10 },
                    pm: char.stats?.pm || { current: 10, max: 10 },
                    def: char.stats?.def || 10,
                    avatarUrl: char.imageUrl || "https://i.pinimg.com/736x/8f/3e/60/8f3e60156d94225d36087798363673c6.jpg" // Fallback image
                  }}
                  onSelect={() => setSelectedAgent(char)}
                />
              </motion.div>
            ))}
            {!loading && (
              <div className="w-64 h-80 flex-shrink-0 bg-zinc-900/20 border border-dashed border-white/10 rounded-xl flex items-center justify-center cursor-pointer hover:bg-zinc-900/40 transition-colors">
                <div className="flex flex-col items-center text-white/30">
                  <Plus className="w-8 h-8 mb-2" />
                  <span className="text-xs font-bold uppercase">Novo Agente</span>
                </div>
              </div>
            )}
          </div>
          <ScrollBar orientation="horizontal" className="bg-white/5" />
        </ScrollArea>
      </section>

      {/* System Status Footer */}
      <footer className="border-t border-white/5 pt-8 mt-12 flex justify-between items-center text-xs text-muted-foreground/50 uppercase tracking-widest">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_5px_limegreen] animate-pulse" /> SYSTEM ONLINE</span>
          <span>V 2.1.0 (ALPHA)</span>
        </div>
        <div>
          SECURE CONNECTION // T20 OS
        </div>
      </footer>

      {/* Agent Detail Modal */}
      <Dialog open={!!selectedAgent} onOpenChange={(open) => !open && setSelectedAgent(null)}>
        <DialogContent className="max-w-4xl h-[90vh] bg-zinc-950 border-zinc-800 p-0 overflow-hidden text-white sm:max-w-[1000px]">
          {selectedAgent && (
            <div className="flex h-full">
              {/* Sidebar Image */}
              <div className="w-1/3 h-full relative hidden md:block">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-zinc-950 z-10" />
                <img src={selectedAgent.imageUrl || "https://i.pinimg.com/736x/8f/3e/60/8f3e60156d94225d36087798363673c6.jpg"} className="w-full h-full object-cover opacity-50" />
                <div className="absolute bottom-8 left-8 z-20">
                  <h2 className="text-4xl font-bold uppercase tracking-tighter">{selectedAgent.name}</h2>
                  <div className="text-primary font-mono text-sm tracking-widest uppercase">{selectedAgent.className} • {selectedAgent.level * 5}% NEX</div>
                </div>
              </div>

              {/* Sheet Content */}
              <div className="flex-1 h-full p-8 overflow-y-auto">
                <OrdemSheet
                  character={{
                    ...selectedAgent,
                    hp: selectedAgent.stats?.hp || { current: 20, max: 20 },
                    pm: selectedAgent.stats?.pm || { current: 5, max: 5 },
                    attributes: selectedAgent.attributes || { agi: 1, for: 1, int: 1, pre: 1, vig: 1 }
                  }}
                  onRoll={(expr: string, label: string) => {
                    // 1. Calculate Result (Mock for dashboard)
                    // In real play, this goes to backend. Here we just show local result.
                    const bonus = parseInt(expr.split('+')[1]) || 0;
                    const d20 = Math.floor(Math.random() * 20) + 1;
                    const total = d20 + bonus;

                    // 2. Feedback (C.O.R.T.E.X. Style)
                    toast.success(
                      <div className="flex flex-col">
                        <span className="font-bold uppercase tracking-wider">{label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-mono text-primary">{d20}</span>
                          <span className="text-muted-foreground text-xs">+ {bonus} =</span>
                          <span className="text-2xl font-bold text-white">{total}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase mt-1">
                          {d20 === 20 ? "CRÍTICO! O sistema detecta uma anomalia favorável." : d20 === 1 ? "FALHA CATASTRÓFICA! Ruído na conexão." : "Dados computados."}
                        </span>
                      </div>,
                      {
                        style: { background: 'rgba(0,0,0,0.9)', borderColor: d20 === 20 ? '#22c55e' : d20 === 1 ? '#ef4444' : '#333' }
                      }
                    )

                    // 3. Log for AI (Future)
                    console.log("[CORTEX] Roll detected:", { expr, total, label });
                  }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
