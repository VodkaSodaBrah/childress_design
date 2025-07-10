// src/components/StartLineHelper.tsx
import React, { useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Define and export the interfaces
export interface StartLinePosition {
  position: [number, number, number];
  rotation: number;
}

export interface StartLineHelperProps {
  onStartLineFound?: (startLine: StartLinePosition) => void;
}

// Export the component with proper typing
export default function StartLineHelper({ onStartLineFound }: StartLineHelperProps) {
  const { scene } = useThree();
  const { scene: trackModel } = useGLTF('/models/f1_bahrain_lowpoly_circuit.glb');
  const [startLinePosition, setStartLinePosition] = useState<StartLinePosition | null>(null);
  const [hasNotifiedParent, setHasNotifiedParent] = useState(false);
  
  // Find starting line position from track model - only run once
  useEffect(() => {
    if (!trackModel || hasNotifiedParent) return;
    
    console.log("Searching for start line in track model...");
    
    // Names that might indicate starting position
    const startLineKeywords = ['start', 'grid', 'line', 'pole'];
    let startObject: THREE.Object3D | undefined;
    
    // Track scale matches what's used in the Track component
    const trackScale = 0.25;
    
    // Search through all objects in the track model
    trackModel.traverse((object) => {
      const name = object.name.toLowerCase();
      
      // Log only important parts for debugging
      if (object instanceof THREE.Mesh && startLineKeywords.some(keyword => name.includes(keyword))) {
        console.log(`Found track part: ${object.name}`);
      }
      
      // Check if this might be the starting line
      if (startLineKeywords.some(keyword => name.includes(keyword))) {
        console.log(`Potential start line found: ${object.name}`);
        startObject = object;
      }
    });
    
    // Default position and rotation
    let startPosition: [number, number, number] = [12.9 * trackScale, 0.05, 13.5 * trackScale];
    let startRotation = 0;
    
    // If we found a potential starting line object
    if (startObject) {
      // Get world position
      const position = new THREE.Vector3();
      startObject.getWorldPosition(position);
      
      // Scale position to match the track scale
      startPosition = [
        position.x * trackScale,
        position.y * trackScale + 0.05, // Small Y offset
        position.z * trackScale
      ];
      
      // Try to determine rotation
      startRotation = startObject.rotation.y;
    } else {
      console.log("No start line found, using default position");
    }
    
    // Use raycasting to find the exact height at this position
    const raycaster = new THREE.Raycaster(
      new THREE.Vector3(startPosition[0], 50, startPosition[2]),
      new THREE.Vector3(0, -1, 0)
    );
    
    // Only raycast against meshes that aren't the car
    const meshesToIntersect: THREE.Mesh[] = [];
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.name.toLowerCase().includes('track')) {
        meshesToIntersect.push(object);
      }
    });
    
    const intersects = raycaster.intersectObjects(meshesToIntersect, true);
    
    if (intersects.length > 0) {
      startPosition[1] = intersects[0].point.y + 0.1; // Adjust Y position to be above the track
    }
    
    // Create the final position object
    const finalStartLine: StartLinePosition = {
      position: startPosition,
      rotation: startRotation
    };
    
    // Set local state
    setStartLinePosition(finalStartLine);
    
    // Only notify the parent once to avoid infinite updates
    if (onStartLineFound && !hasNotifiedParent) {
      onStartLineFound(finalStartLine);
      setHasNotifiedParent(true);
    }
    
    console.log("Final start line position:", finalStartLine);
    
  }, [trackModel, scene, onStartLineFound, hasNotifiedParent]);
  
  // Optional: Render a visual marker at the start line position for debugging
  return startLinePosition ? (
    <mesh position={startLinePosition.position} rotation={[0, startLinePosition.rotation, 0]}>
      <boxGeometry args={[1, 0.1, 1]} />
      <meshStandardMaterial color="red" transparent opacity={0.5} />
    </mesh>
  ) : null;
}