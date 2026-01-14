"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

interface AttributeRadarProps {
    attributes: {
        for: number;
        des: number;
        con: number;
        int: number;
        sab: number;
        car: number;
    };
    onAttributeClick?: (attr: string) => void;
}

const ATTRIBUTES = [
    { key: "for", label: "FOR", angle: 270 }, // Top
    { key: "des", label: "DES", angle: 330 }, // Top Right
    { key: "int", label: "INT", angle: 30 },  // Bottom Right
    { key: "sab", label: "SAB", angle: 90 },  // Bottom
    { key: "car", label: "CAR", angle: 150 }, // Bottom Left
    { key: "con", label: "CON", angle: 210 }, // Top Left
];

export function AttributeRadar({ attributes, onAttributeClick }: AttributeRadarProps) {
    const size = 300;
    const center = size / 2;
    const maxStat = 20; // Assume 20 is the edge (can scale)
    const scale = (size * 0.4) / maxStat; // 40% of size is max radius

    // Helper to get coordinates
    const getPoint = (value: number, angle: number) => {
        const rad = (angle * Math.PI) / 180;
        return {
            x: center + Math.cos(rad) * value * scale,
            y: center + Math.sin(rad) * value * scale,
        };
    };

    // Calculate Polygon Points
    const points = useMemo(() => {
        return ATTRIBUTES.map(attr => {
            const val = attributes[attr.key as keyof typeof attributes] || 0;
            const p = getPoint(val, attr.angle);
            return `${p.x},${p.y}`;
        }).join(" ");
    }, [attributes]);

    // Calculate Background Grid (levels 5, 10, 15, 20)
    const gridLevels = [5, 10, 15, 20];

    return (
        <div className="relative w-full aspect-square max-w-[300px] flex items-center justify-center">
            {/* SVG Render */}
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
                {/* Background Grid */}
                {gridLevels.map(level => (
                    <polygon
                        key={level}
                        points={ATTRIBUTES.map(attr => {
                            const p = getPoint(level, attr.angle);
                            return `${p.x},${p.y}`;
                        }).join(" ")}
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="1"
                        strokeDasharray={level === 20 ? "0" : "4 4"}
                    />
                ))}

                {/* Axis Lines */}
                {ATTRIBUTES.map(attr => {
                    const p = getPoint(maxStat, attr.angle);
                    return (
                        <line
                            key={attr.key}
                            x1={center}
                            y1={center}
                            x2={p.x}
                            y2={p.y}
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="1"
                        />
                    );
                })}

                {/* The Stats Polygon */}
                <motion.polygon
                    points={points}
                    fill="rgba(239, 68, 68, 0.2)" // red-500/20
                    stroke="#ef4444" // red-500
                    strokeWidth="2"
                    initial={{ scale: 0, opacity: 0, transformOrigin: "center" }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                />

                {/* Vertex Dots & Labels */}
                {ATTRIBUTES.map(attr => {
                    const val = attributes[attr.key as keyof typeof attributes] || 0;
                    const p = getPoint(val, attr.angle);
                    const labelP = getPoint(maxStat + 4, attr.angle);

                    return (
                        <g key={attr.key} onClick={() => onAttributeClick?.(attr.key)} className="cursor-pointer group">
                            {/* Hover Hit Box */}
                            <circle cx={p.x} cy={p.y} r="15" fill="transparent" />

                            {/* Visual Dot */}
                            <circle
                                cx={p.x}
                                cy={p.y}
                                r="4"
                                className="fill-red-500 group-hover:fill-white transition-colors"
                            />

                            {/* Label */}
                            <text
                                x={labelP.x}
                                y={labelP.y}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="fill-muted-foreground text-[10px] font-mono uppercase tracking-widest group-hover:fill-white group-hover:font-bold transition-all"
                            >
                                {attr.label}
                            </text>
                            {/* Value Label */}
                            <text
                                x={p.x}
                                y={p.y - 12}
                                textAnchor="middle"
                                className="fill-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                {val}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
