"use client";

import { MapPin, Target, ScanEye, X } from "lucide-react";
import { useEffect, useRef } from "react";

interface MapContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onSelect: (action: 'PING' | 'MARKER' | 'SCAN') => void;
}

export function MapContextMenu({ x, y, onClose, onSelect }: MapContextMenuProps) {
    const ref = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [onClose]);

    return (
        <div
            ref={ref}
            className="fixed z-50 w-48 bg-black/90 border border-white/20 rounded-lg shadow-2xl backdrop-blur-md overflow-hidden animate-in fade-in zoom-in-95 duration-100"
            style={{ top: y, left: x }}
            onContextMenu={(e) => e.preventDefault()}
        >
            <div className="p-1 space-y-1">
                <button
                    onClick={() => onSelect('PING')}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-bold text-white hover:bg-white/10 rounded transition-colors"
                >
                    <Target className="w-4 h-4 text-red-500" />
                    Pingar Posição
                </button>
                <button
                    onClick={() => onSelect('MARKER')}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-bold text-white hover:bg-white/10 rounded transition-colors"
                >
                    <MapPin className="w-4 h-4 text-blue-500" />
                    Adicionar Marcador
                </button>
                <button
                    onClick={() => onSelect('SCAN')}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-bold text-white hover:bg-white/10 rounded transition-colors text-muted-foreground"
                >
                    <ScanEye className="w-4 h-4" />
                    Escanear Área
                </button>
            </div>
            <div className="border-t border-white/10 p-1 bg-white/5 text-[8px] text-center text-muted-foreground uppercase tracking-widest">
                T20 Tactical OS
            </div>
        </div>
    );
}
