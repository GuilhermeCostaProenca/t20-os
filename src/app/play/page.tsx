"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function PlayHomePage() {
  const [roomCode, setRoomCode] = useState("");
  const router = useRouter();

  function handleEnter() {
    const code = roomCode.trim().toUpperCase();
    if (code.length < 4) return;
    router.push(`/play/${code}`);
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <Badge className="border-primary/25 bg-primary/10 text-primary">Modo Jogador</Badge>
          <h1 className="text-2xl font-bold">Entrar na mesa</h1>
          <p className="text-sm text-muted-foreground">
            Digite o room code compartilhado pelo mestre para ver as revelações.
          </p>
        </div>
        <Card className="chrome-panel border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle>Conectar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="Ex.: XJ93TA"
              className="uppercase"
            />
            <Button className="w-full gap-2" onClick={handleEnter} disabled={roomCode.trim().length < 4}>
              <Sparkles className="h-4 w-4" />
              Entrar
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
