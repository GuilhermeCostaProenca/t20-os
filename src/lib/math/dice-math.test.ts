
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { getDieResult } from './dice-math';

describe('Dice Math (Physics Authority)', () => {
    // Setup a simple D6
    // Normals: Top (0,1,0), Bottom (0,-1,0), Front (0,0,1)...
    const labels = [
        { text: "1", norm: new THREE.Vector3(0, 1, 0) },  // UP in local space
        { text: "6", norm: new THREE.Vector3(0, -1, 0) }, // DOWN in local space
        { text: "3", norm: new THREE.Vector3(0, 0, 1) },  // FRONT
        { text: "4", norm: new THREE.Vector3(0, 0, -1) }, // BACK
        { text: "2", norm: new THREE.Vector3(1, 0, 0) },  // RIGHT
        { text: "5", norm: new THREE.Vector3(-1, 0, 0) }, // LEFT
    ];

    it('should return 1 when unrotated (Identity Quaternion)', () => {
        const q = new THREE.Quaternion(); // Identity
        const result = getDieResult(labels, q);
        expect(result).toBe(1);
    });

    it('should return 6 when rotated 180 degrees on X (flipped upside down)', () => {
        const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
        const result = getDieResult(labels, q);
        expect(result).toBe(6);
    });

    it('should return 3 when rotated 90 degrees on X (Front face up)', () => {
        const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
        // Rotate 90 deg around X:
        // Local (0,1,0) [Text 1] -> (0,0,1) [Front] -> (0,0,1) is Front? No wait.

        // Let's visualize: 
        // Initial: Y+ is Up.
        // Rotate X+ 90 deg.
        // The Y+ axis rotates to Z+. 
        // So face "1" is now at Z+. 
        // The face that WAS at Z- (Back, "4") rotates to Y+ (Up).
        // Wait, math check.
        // newY = cos(90)y - sin(90)z = -z.
        // newZ = sin(90)y + cos(90)z = y.
        // So old Y (Face 1) goes to Z.
        // Old Z (Face 3) goes to -Y.
        // Old -Z (Face 4) goes to Y (UP).
        // So result should be 4.

        const result = getDieResult(labels, q);
        expect(result).toBe(4);
    });
});
