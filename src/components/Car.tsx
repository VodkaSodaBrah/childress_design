"use client";
import React, { forwardRef, useEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { Group } from 'three';

interface CarProps {
  position?: [number, number, number];
  scale?: [number, number, number];
}

const Car = forwardRef<Group, CarProps>(({ position = [0, 0, 0], scale = [1, 1, 1] }, ref) => {
  // Create a local ref if external ref is not provided
  const localRef = useRef<Group>(null);
  // Use the correct way to handle forwardRef with TypeScript
  const carRef = (ref || localRef) as React.RefObject<Group>;
  
  // References to wheel objects
  const wheelFrontLeftRef = useRef<THREE.Object3D | null>(null);
  const wheelFrontRightRef = useRef<THREE.Object3D | null>(null);
  const wheelBackLeftRef = useRef<THREE.Object3D | null>(null);
  const wheelBackRightRef = useRef<THREE.Object3D | null>(null);

  // Approximate wheel radius in world units after scaling
  const wheelRadius = 0.26;      // tweak if needed
  // Fixed ground offset matching the track's bottom alignment
  const groundOffset = 0.05;
  
  // Update the path to where your GLB file is located in the public folder
  const { scene } = useGLTF('/models/f1car.glb');
  
  // Log when model is loaded successfully
  useEffect(() => {
    if (scene) {
      console.log("Car model loaded successfully!");
    } else {
      console.error("Failed to load car model");
    }
  }, [scene]);
  
  // Find and reference wheel objects
  useEffect(() => {
    if (scene) {
      // Apply materials or modify the loaded model
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          // Make car cast shadows
          child.castShadow = true;
          
          // Match the exact names from your model
          const childName = child.name.toLowerCase();
          
          if (childName === 'front_wheels') {
            // Front wheels are a single object, assign to both left and right
            wheelFrontLeftRef.current = child;
            wheelFrontRightRef.current = child;
            console.log("Found front wheels:", child.name);
          } else if (childName === 'back_wheels') {
            // Back wheels are a single object, assign to both left and right
            wheelBackLeftRef.current = child;
            wheelBackRightRef.current = child;
            console.log("Found back wheels:", child.name);
          }
        }
      });
      
      // If wheel detection by name fails, let's try to find them by position
      if (!wheelFrontLeftRef.current && !wheelFrontRightRef.current) {
        console.log("Trying to find wheels by position...");
        // Print names of all meshes for debugging
        scene.traverse(child => {
          if ((child as THREE.Mesh).isMesh) {
            console.log("Mesh name:", child.name);
          }
        });
      }
    }
  }, [scene]);
  
  // Expose wheel refs and other properties to parent through ref
  React.useImperativeHandle(ref, () => {
    const group = carRef.current as Group & {
      wheelRefs?: {
        frontLeft: React.RefObject<THREE.Object3D | null>,
        frontRight: React.RefObject<THREE.Object3D | null>,
        backLeft: React.RefObject<THREE.Object3D | null>,
        backRight: React.RefObject<THREE.Object3D | null>,
      },
      wheelRadius?: number,
      groundOffset?: number
    };
    
    if (group) {
      group.wheelRefs = {
        frontLeft: wheelFrontLeftRef,
        frontRight: wheelFrontRightRef,
        backLeft: wheelBackLeftRef,
        backRight: wheelBackRightRef
      };
      group.wheelRadius = wheelRadius;
      group.groundOffset = groundOffset;
    }
    
    return group;
  }, [wheelRadius, groundOffset, carRef]); // Add carRef to dependencies
  
  // Update the return section
  return (
    <group ref={carRef} position={position} scale={scale}>
      {/* Make the car much smaller and adjust position */}
      <group position={[0, 0.2, 0]} scale={[0.5, 0.5, 0.5]}> {/* Reduced scale from [2,2,2] to [0.5,0.5,0.5] */}
        {scene && <primitive object={scene.clone()} />}
        
        {/* Debug helper to show car origin - make it smaller and less obtrusive */}
        <mesh>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial color="blue" wireframe />
        </mesh>
      </group>
    </group>
  );
});

// Add display name to fix ESLint warning
Car.displayName = 'Car';

// Enable preloading for better performance
useGLTF.preload('/models/f1car.glb');

export default Car;