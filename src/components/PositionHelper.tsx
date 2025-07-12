// src/components/PositionHelper.tsx
import { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface PositionHelperProps {
  onTrackDataFound?: (data: {
    startPosition: [number, number, number];
    trackSurfaceY: number;
  }) => void;
}

export default function PositionHelper({ onTrackDataFound }: PositionHelperProps) {
  const { scene } = useGLTF('/models/f1_bahrain_lowpoly_circuit.glb');
  
  useEffect(() => {
    if (!scene) return;
    
    // Clone and scale the scene to match what Track.tsx does
    const trackClone = scene.clone();
    trackClone.scale.set(0.25, 0.25, 0.25);
    
    // Apply the same positioning logic as Track.tsx
    const bbox = new THREE.Box3().setFromObject(trackClone);
    const minY = bbox.min.y;
    const center = bbox.getCenter(new THREE.Vector3());
    trackClone.position.set(
      -center.x,
      -minY + 0.05, // Same as Track.tsx
      -center.z
    );
    
    // Now find the track surface and starting position
    let trackSurfaceY = 0.05; // Default fallback
    let startPosition: [number, number, number] = [0, 0, 0];
    
    // Find all meshes that could be track surface
    const trackMeshes: THREE.Mesh[] = [];
    trackClone.traverse((child) => {
      console.log("Track part:", child.name, "Position:", child.position);
      
      if (child instanceof THREE.Mesh) {
        trackMeshes.push(child);
        
        // Look for starting grid or main straight
        if (child.name.toLowerCase().includes('start') || 
            child.name.toLowerCase().includes('grid') ||
            child.name.toLowerCase().includes('straight') ||
            child.name.toLowerCase().includes('track')) {
          
          // Get the bounding box of this mesh
          const meshBbox = new THREE.Box3().setFromObject(child);
          const topY = meshBbox.max.y;
          console.log(`Found track surface "${child.name}" at Y: ${topY}`);
          
          if (topY > trackSurfaceY) {
            trackSurfaceY = topY;
          }
          
          // Use the center of this mesh as starting position
          const meshCenter = meshBbox.getCenter(new THREE.Vector3());
          startPosition = [meshCenter.x, topY, meshCenter.z];
        }
      }
    });
    
    // If no specific starting area found, use the center of the track
    if (startPosition[0] === 0 && startPosition[2] === 0) {
      const trackCenter = bbox.getCenter(new THREE.Vector3());
      const trackTop = bbox.max.y;
      startPosition = [trackCenter.x, trackTop, trackCenter.z];
      trackSurfaceY = trackTop;
    }
    
    console.log("Final track surface Y:", trackSurfaceY);
    console.log("Final start position:", startPosition);
    
    // Provide the data back to GameScene
    if (onTrackDataFound) {
      onTrackDataFound({
        startPosition,
        trackSurfaceY
      });
    }
    
  }, [scene, onTrackDataFound]);
  
  return null;
}