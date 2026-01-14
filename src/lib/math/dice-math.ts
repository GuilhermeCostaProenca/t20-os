
import * as THREE from 'three';

/**
 * Calculates which face of a die is facing UP (World Y+) based on its orientation.
 * @param labels Array of faces with their local normals and text values.
 * @param quaternion The current rotation of the die.
 * @returns The value of the face pointing up.
 */
export function getDieResult(
    labels: { norm: THREE.Vector3, text: string }[],
    quaternion: THREE.Quaternion
): number | string {
    let bestDot = -Infinity;
    let result: string | number = 1;

    // World UP vector
    const worldUp = new THREE.Vector3(0, 1, 0);

    labels.forEach((l) => {
        // Transform the local normal by the die's rotation
        // We clone because applyQuaternion mutates
        const worldNormal = l.norm.clone().applyQuaternion(quaternion);

        // Dot product with UP. 1.0 means perfectly up.
        const dot = worldNormal.dot(worldUp);

        if (dot > bestDot) {
            bestDot = dot;
            result = isNaN(parseInt(l.text)) ? l.text : parseInt(l.text);
        }
    });

    return result;
}
