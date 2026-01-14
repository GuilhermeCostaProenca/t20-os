"use client";

import { useConvexPolyhedron, useBox } from "@react-three/cannon";
import { useMemo, useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { Geometry } from "three-stdlib";
import { getDieResult } from "@/lib/math/dice-math";

// Valid dice types
export type DieType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';

// Geometries map
const getGeometry = (type: DieType): THREE.BufferGeometry => {
    switch (type) {
        case 'd4': return new THREE.TetrahedronGeometry(0.5);
        case 'd6': return new THREE.BoxGeometry(0.7, 0.7, 0.7);
        case 'd8': return new THREE.OctahedronGeometry(0.5);
        case 'd10': return new THREE.IcosahedronGeometry(0.5); // Placeholder (D10 is complex)
        case 'd12': return new THREE.DodecahedronGeometry(0.5);
        case 'd20': return new THREE.IcosahedronGeometry(0.5);
        default: return new THREE.IcosahedronGeometry(0.5); // Fallback
    }
};

const getColors = (type: DieType) => {
    switch (type) {
        case 'd4': return '#ffd700'; // Gold
        case 'd6': return '#ff6b6b'; // Red
        case 'd8': return '#4ecdc4'; // Teal
        case 'd10': return '#a66cff'; // Purple
        case 'd12': return '#ff9f43'; // Orange
        case 'd20': return '#ff4757'; // Crimson
    }
}

// Helper to extract vertices/faces from BufferGeometry
function toConvexProps(bufferGeometry: THREE.BufferGeometry) {
    if (!bufferGeometry?.attributes?.position) return [[], []]; // Safety check
    const posAttribute = bufferGeometry.attributes.position;
    const vertices: number[][] = [];

    // Extract vertices
    for (let i = 0; i < posAttribute.count; i++) {
        vertices.push([
            posAttribute.getX(i),
            posAttribute.getY(i),
            posAttribute.getZ(i)
        ]);
    }

    const faces: number[][] = [];
    // Extract faces
    if (bufferGeometry.index) {
        // Indexed geometry
        for (let i = 0; i < bufferGeometry.index.count; i += 3) {
            faces.push([
                bufferGeometry.index.getX(i),
                bufferGeometry.index.getX(i + 1),
                bufferGeometry.index.getX(i + 2)
            ]);
        }
    } else {
        // Non-indexed geometry (triplets)
        for (let i = 0; i < posAttribute.count; i += 3) {
            faces.push([i, i + 1, i + 2]);
        }
    }

    return [vertices, faces];
}

import { Text } from "@react-three/drei";

// ... existing imports

// Helper to compute face label positions
const getFaceLabels = (geometry: THREE.BufferGeometry) => {
    const pos = geometry.attributes.position;
    const index = geometry.index;
    const centers: { vec: THREE.Vector3, normal: THREE.Vector3 }[] = [];

    // Helper to get triangle center/normal
    const processTriangle = (a: number, b: number, c: number) => {
        const vA = new THREE.Vector3().fromBufferAttribute(pos, a);
        const vB = new THREE.Vector3().fromBufferAttribute(pos, b);
        const vC = new THREE.Vector3().fromBufferAttribute(pos, c);

        const center = new THREE.Vector3().add(vA).add(vB).add(vC).divideScalar(3);
        const normal = new THREE.Vector3().crossVectors(new THREE.Vector3().subVectors(vB, vA), new THREE.Vector3().subVectors(vC, vA)).normalize();
        return { vec: center, normal };
    };

    if (index) {
        for (let i = 0; i < index.count; i += 3) {
            centers.push(processTriangle(index.getX(i), index.getX(i + 1), index.getX(i + 2)));
        }
    } else {
        for (let i = 0; i < pos.count; i += 3) {
            centers.push(processTriangle(i, i + 1, i + 2));
        }
    }

    // Deduplicate faces (Merge close normals)
    const uniqueFaces: { pos: THREE.Vector3, norm: THREE.Vector3 }[] = [];

    centers.forEach(c => {
        const existing = uniqueFaces.find(f => f.norm.angleTo(c.normal) < 0.1);
        if (!existing) {
            uniqueFaces.push({ pos: c.vec, norm: c.normal });
        } else {
            // Average position for multi-triangle faces (like D12 pentagons)
            existing.pos.add(c.vec).divideScalar(2); // Weighted average would be better but this works for regular
        }
    });

    return uniqueFaces.map((f, i) => ({
        pos: f.pos.clone().multiplyScalar(1.10), // Push out more (10%) to prevent Z-fighting
        norm: f.norm,
        text: (i + 1).toString()
    }));
};

export function Die({ type, position, velocity, onRest }: {
    type: DieType,
    position: [number, number, number],
    velocity: [number, number, number],
    onRest?: (value: number) => void
}) {
    const geometry = useMemo(() => getGeometry(type), [type]);

    // Labels
    const labels = useMemo(() => {
        // Box (D6) needs special mapping because index order isn't guaranteed to be "1..6" nicely aligned 
        // to opposite sides (1-6, 2-5, 3-4). 
        // procedural generation is random order.
        // For MVP visuals, random order is fine. "O dado define o numero".
        return getFaceLabels(geometry);
    }, [geometry]);

    // ... (args useMemo) ...
    const args = useMemo(() => {
        if (type === 'd6') return [0.35, 0.35, 0.35];
        return toConvexProps(geometry);
    }, [geometry, type]);

    const [ref, api] = useConvexPolyhedron(() => ({
        mass: 1,
        position,
        velocity,
        angularVelocity: [Math.random() * 20, Math.random() * 20, Math.random() * 20],
        args: type === 'd6' ? undefined : (args as any),
        material: { friction: 0.1, restitution: 0.5 },
        onCollide: (e) => { }
    }));

    // Resting Logic
    const [resting, setResting] = useState(false);
    // Subscribe to velocity and quaternion to detect rest and orientation
    useEffect(() => {
        let currentVelocity = [0, 0, 0];
        let currentAngularVelocity = [0, 0, 0];
        let currentQuaternion = [0, 0, 0, 1];

        // Subscribe to velocity
        const unsubVel = api.velocity.subscribe(v => currentVelocity = v);
        // Subscribe to angular velocity
        const unsubAngVel = api.angularVelocity.subscribe(v => currentAngularVelocity = v);
        // Subscribe to quaternion (orientation)
        const unsubQuat = api.quaternion.subscribe(q => currentQuaternion = q);

        const checkRest = setInterval(() => {
            const speed = Math.sqrt(currentVelocity[0] ** 2 + currentVelocity[1] ** 2 + currentVelocity[2] ** 2);
            const angSpeed = Math.sqrt(currentAngularVelocity[0] ** 2 + currentAngularVelocity[1] ** 2 + currentAngularVelocity[2] ** 2);

            if (speed < 0.05 && angSpeed < 0.1) {
                if (!resting) {
                    setResting(true);

                    // True Physics Calculation (Verified by Tests)
                    // 1. Create a Quaternion from the physics body
                    const quat = new THREE.Quaternion(currentQuaternion[0], currentQuaternion[1], currentQuaternion[2], currentQuaternion[3]);

                    // 2. Calculate Result using tested math library
                    const result = getDieResult(
                        labels.map(l => ({ norm: l.norm, text: l.text })),
                        quat
                    );

                    const numericResult = typeof result === 'string' ? parseInt(result) : result; // Safety cast

                    if (onRest) onRest(numericResult);
                    clearInterval(checkRest); // Stop checking once rested
                }
            } else {
                if (resting) setResting(false);
            }
        }, 100); // Check every 100ms

        return () => {
            unsubVel();
            unsubAngVel();
            unsubQuat();
            clearInterval(checkRest);
        };
    }, [api.velocity, api.angularVelocity, api.quaternion, resting, labels, onRest]);

    return (
        <mesh ref={ref as any} castShadow receiveShadow geometry={geometry}>
            <meshStandardMaterial color={getColors(type)} flatShading />
            <lineSegments>
                <wireframeGeometry args={[geometry]} />
                <lineBasicMaterial color="white" transparent opacity={0.3} />
            </lineSegments>

            {labels.map((l, i) => (
                <Text
                    key={i}
                    position={l.pos}
                    quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), l.norm)}
                    fontSize={0.25}
                    color={type === 'd4' || type === 'd12' ? "black" : "white"}
                    anchorX="center"
                    anchorY="middle"
                >
                    {l.text}
                </Text>
            ))}
        </mesh>
    );
}
