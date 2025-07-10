// src/components/PositionHelper.tsx
import { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export default function PositionHelper() {
  // Load the Bahrain circuit model
  const { scene } = useGLTF('/models/f1_bahrain_lowpoly_circuit.glb');
  
  useEffect(() => {
    // Find specific parts of the track
    let startingGrid: THREE.Object3D | null = null;
    
    scene.traverse((child) => {
      // Log names to help find key track parts
      console.log("Track part:", child.name);
      
      // Try to identify starting grid or main straight
      if (child.name.toLowerCase().includes('start') || 
          child.name.toLowerCase().includes('grid') ||
          child.name.toLowerCase().includes('straight')) {
        startingGrid = child;
        console.log("Found potential starting grid:", child);
        console.log("Position:", child.position);
      }
    });
    
    // If we found the starting grid, log its position
    if (startingGrid) {
      console.log("Starting grid position:", (startingGrid as THREE.Object3D).position);
    } else {
      console.log("Couldn't find starting grid, using these parts instead:");
      // List top-level objects in the scene to help identify track parts
      scene.children.forEach((child, index) => {
        console.log(`Top level object ${index}:`, child.name, child.position);
      });
    }
  }, [scene]);
  
  return null;
}