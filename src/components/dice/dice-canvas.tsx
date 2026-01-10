"use client";

import { Canvas } from "@react-three/fiber";
import { Physics, usePlane } from "@react-three/cannon";
import { useState, useImperativeHandle, forwardRef, useEffect } from "react";
import { Die, DieType } from "./die";

function Floor() {
    const [ref] = usePlane(() => ({
        rotation: [-Math.PI / 2, 0, 0],
        material: { friction: 0.3, restitution: 0.3 }
    }));
    return (
        <mesh ref={ref as any} receiveShadow>
            <planeGeometry args={[100, 100]} />
            <shadowMaterial color="#000000" opacity={0.3} />
        </mesh>
    );
}

export type DiceCanvasRef = {
    roll: (dice: DieType[]) => void;
};

export const DiceCanvas = forwardRef<DiceCanvasRef, { onResult?: (total: number) => void }>((props, ref) => {
    const [dice, setDice] = useState<{ id: number, type: DieType, pos: [number, number, number], vel: [number, number, number] }[]>([]);

    // Track results
    // We use a Map to store results by ID to avoid duplicates (if onRest fires multiple times, though it shouldn't)
    // and to know when we are done.
    const [results, setResults] = useState<Record<number, number>>({});

    useImperativeHandle(ref, () => ({
        roll: (types: DieType[]) => {
            setResults({}); // Clear results
            const newDice = types.map((t, i) => ({
                id: Date.now() + i,
                type: t,
                pos: [(Math.random() - 0.5) * 3, 5 + i * 1.5, (Math.random() - 0.5) * 3] as [number, number, number],
                vel: [(Math.random() - 0.5) * 5, -5, (Math.random() - 0.5) * 5] as [number, number, number]
            }));
            setDice(newDice);
        }
    }));

    // Check for completion
    useEffect(() => {
        if (dice.length > 0 && Object.keys(results).length === dice.length) {
            // All dice settled
            const total = Object.values(results).reduce((a, b) => a + b, 0);
            if (props.onResult) props.onResult(total);
        }
    }, [results, dice, props.onResult]);

    // We can aggregate results here if we want, but for MVP let's just let them land.
    // The "onResult" prop could be callback for sum.

    return (
        <div className="absolute inset-0 pointer-events-none z-0">
            <Canvas
                shadows
                camera={{ position: [0, 12, 0], fov: 50 }} // Top-down-ish view
                style={{ pointerEvents: "none" }}
            >
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 20, 10]} angle={0.5} penumbra={1} castShadow intensity={1} />
                <pointLight position={[-10, 10, -10]} intensity={0.5} />

                <Physics gravity={[0, -15, 0]}>
                    <Floor />
                    {dice.map(d => (
                        <Die
                            key={d.id}
                            type={d.type}
                            position={d.pos}
                            velocity={d.vel}
                            onRest={(val) => {
                                setResults(prev => ({ ...prev, [d.id]: val }));
                            }}
                        />
                    ))}
                </Physics>
            </Canvas>
        </div>
    );
});
