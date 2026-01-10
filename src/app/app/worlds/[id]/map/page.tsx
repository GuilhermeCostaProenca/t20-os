"use client";

import { use, useState } from "react";
import { InteractiveMap } from "@/components/map/interactive-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Layers, Map as MapIcon, Maximize2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MapPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [fullscreen, setFullscreen] = useState(false);

    return (
        <div className="flex h-screen w-full flex-col bg-black">
            {/* HUD Header */}
            <div className="absolute top-0 left-0 z-20 w-full p-4 pointer-events-none">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 pointer-events-auto">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="bg-black/50 text-white hover:bg-black/70 rounded-full"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold text-white drop-shadow-md tracking-tight flex items-center gap-2">
                                <MapIcon className="h-5 w-5 text-primary" />
                                Atlas Interativo
                            </h1>
                            <Badge variant="outline" className="w-fit border-white/20 bg-black/40 text-xs text-white/70 backdrop-blur-sm">
                                BETA • MapLibre GL JS
                            </Badge>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pointer-events-auto">
                        <Button variant="outline" size="icon" className="bg-black/40 border-white/10 text-white backdrop-blur-md">
                            <Layers className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="bg-black/40 border-white/10 text-white backdrop-blur-md">
                            <Maximize2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Map Container */}
            <div className="relative flex-1">
                <InteractiveMap
                    className="h-full w-full"
                    onMapReady={(map) => console.log("Map Ready", map)}
                />
            </div>
        </div>
    );
}
