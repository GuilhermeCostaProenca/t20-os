"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { cn } from "@/lib/utils";

/**
 * map_brief.md Implementation
 * Status: MVP / Core
 * 
 * Rules:
 * 1. React controls UI.
 * 2. MapLibre controls World.
 */

import { MapContextMenu } from "./map-context-menu";

type Token = {
    id: string;
    name: string;
    avatarUrl?: string;
    x: number;
    y: number;
    color?: string;
};

type Pin = {
    id: string;
    x: number;
    y: number;
    type: 'PING' | 'MARKER';
    label?: string;
};

type InteractiveMapProps = {
    className?: string;
    onMapReady?: (map: maplibregl.Map) => void;
    tokens?: Token[];
    pins?: Pin[];
    onTokenMove?: (id: string, x: number, y: number) => void;
    onPinCreate?: (pin: Pin) => void;
};

export function InteractiveMap({ className, onMapReady, tokens = [], pins = [], onTokenMove, onPinCreate }: InteractiveMapProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const markersRef = useRef<{ [id: string]: maplibregl.Marker }>({});
    const pinMarkersRef = useRef<{ [id: string]: maplibregl.Marker }>({});
    const [ready, setReady] = useState(false);

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, lng: number, lat: number } | null>(null);

    // Initialize Map
    useEffect(() => {
        if (map.current) return;
        if (!mapContainer.current) return;

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: {
                version: 8,
                sources: {
                    'arton-source': {
                        type: 'image',
                        url: '/arton-map.jpg',
                        coordinates: [
                            [-80, 40],  // Top Left
                            [80, 40],   // Top Right
                            [80, -40],  // Bottom Right
                            [-80, -40]  // Bottom Left
                        ]
                    }
                },
                layers: [
                    {
                        id: 'background',
                        type: 'background',
                        paint: { 'background-color': '#0a0a0a' }
                    },
                    {
                        id: 'arton-layer',
                        type: 'raster',
                        source: 'arton-source',
                        paint: { 'raster-fade-duration': 0, 'raster-opacity': 0.8 }
                    }
                ]
            },
            center: [0, 0],
            zoom: 1,
            minZoom: 0,
            maxZoom: 5,
            dragRotate: false,
            attributionControl: false,
        });

        // Context Menu Handler
        map.current.on('contextmenu', (e) => {
            e.preventDefault();
            setContextMenu({
                x: e.point.x,
                y: e.point.y,
                lng: e.lngLat.lng,
                lat: e.lngLat.lat
            });
        });

        // Close context menu on move/click
        map.current.on('click', () => setContextMenu(null));
        map.current.on('movestart', () => setContextMenu(null));

        map.current.on("load", () => {
            setReady(true);
            if (onMapReady && map.current) onMapReady(map.current);
            map.current?.resize();
        });

        return () => {
            map.current?.remove();
        };
    }, []);

    // Sync Tokens
    useEffect(() => {
        if (!map.current || !ready) return;

        // 1. Remove markers not in tokens
        Object.keys(markersRef.current).forEach(id => {
            if (!tokens.find(t => t.id === id)) {
                markersRef.current[id].remove();
                delete markersRef.current[id];
            }
        });

        // 2. Add/Update markers
        tokens.forEach(token => {
            const existing = markersRef.current[token.id];

            if (existing) {
                // Animate to new position
                existing.setLngLat([token.x, token.y]);
            } else {
                // Create DOM element
                const el = document.createElement('div');
                el.className = 'group relative w-10 h-10 cursor-grab active:cursor-grabbing hover:z-50 transition-all';

                // Avatar Ring
                const ring = document.createElement('div');
                ring.className = cn(
                    "w-full h-full rounded-full border-2 overflow-hidden shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-transform group-hover:scale-110",
                    token.color ? `border-[${token.color}]` : "border-white"
                );
                ring.style.borderColor = token.color || "white";

                if (token.avatarUrl) {
                    const img = document.createElement('img');
                    img.src = token.avatarUrl;
                    img.className = "w-full h-full object-cover";
                    ring.appendChild(img);
                } else {
                    ring.className += " bg-neutral-800 flex items-center justify-center font-bold text-xs text-white";
                    ring.innerText = token.name.charAt(0);
                }

                // Name Tooltip
                const tooltip = document.createElement('div');
                tooltip.className = "absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/80 text-[8px] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none";
                tooltip.innerText = token.name;

                el.appendChild(ring);
                el.appendChild(tooltip);

                // Create Marker
                const marker = new maplibregl.Marker({
                    element: el,
                    draggable: true
                })
                    .setLngLat([token.x, token.y])
                    .addTo(map.current!);

                marker.on('dragend', () => {
                    const lngLat = marker.getLngLat();
                    if (onTokenMove) onTokenMove(token.id, lngLat.lng, lngLat.lat);
                });

                markersRef.current[token.id] = marker;
            }
        });

    }, [ready, tokens, onTokenMove]);

    // Sync Pins
    useEffect(() => {
        if (!map.current || !ready) return;

        // Cleanup
        Object.keys(pinMarkersRef.current).forEach(id => {
            if (!pins.find(p => p.id === id)) {
                pinMarkersRef.current[id].remove();
                delete pinMarkersRef.current[id];
            }
        });

        // Add
        pins.forEach(pin => {
            if (pinMarkersRef.current[pin.id]) return; // Static pins don't move usually

            const el = document.createElement('div');

            if (pin.type === 'PING') {
                el.className = 'w-4 h-4 bg-red-500 rounded-full animate-ping opacity-75';
                // Pings should auto-remove visually or be handled by parent removing from 'pins' prop after timeout
            } else {
                el.className = 'flex items-center justify-center';
                el.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
            }

            const marker = new maplibregl.Marker({ element: el })
                .setLngLat([pin.x, pin.y])
                .addTo(map.current!);

            pinMarkersRef.current[pin.id] = marker;
        });
    }, [ready, pins]);


    const handleContextSelect = (action: 'PING' | 'MARKER' | 'SCAN') => {
        if (!contextMenu) return;

        if (action === 'PING' || action === 'MARKER') {
            onPinCreate?.({
                id: crypto.randomUUID(),
                x: contextMenu.lng,
                y: contextMenu.lat,
                type: action,
                label: action === 'MARKER' ? 'Novo Marcador' : undefined
            });
        }

        setContextMenu(null);
    };

    return (
        <div className={cn("relative w-full h-full bg-black/50 overflow-hidden", className)}>
            <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

            {/* Grid Overlay (Optional) */}
            <div className="absolute inset-0 pointer-events-none opacity-5"
                style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />

            {/* Context Menu */}
            {contextMenu && (
                <MapContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    onSelect={handleContextSelect}
                />
            )}

            {!ready && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
                    <div className="animate-pulse flex flex-col items-center gap-2">
                        <span className="text-primary tracking-[0.2em] font-light uppercase text-xs">Carregando Atlas Tático...</span>
                    </div>
                </div>
            )}

            {/* Zoom Controls */}
            <div className="absolute bottom-20 right-4 z-10 flex flex-col gap-1">
                <button onClick={() => map.current?.zoomIn()} className="w-8 h-8 bg-black/80 text-white border border-white/10 rounded flex items-center justify-center hover:bg-primary/20">+</button>
                <button onClick={() => map.current?.zoomOut()} className="w-8 h-8 bg-black/80 text-white border border-white/10 rounded flex items-center justify-center hover:bg-primary/20">-</button>
            </div>
        </div>
    );
}
