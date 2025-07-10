"use client";
import React, { forwardRef, useRef, useEffect, useImperativeHandle } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Group } from 'three';

interface TrackProps {
  world?: CANNON.World;
}

const Track = forwardRef<Group, TrackProps>(({ world, ...props }, ref) => {
  const localRef = useRef<Group>(null);
  useImperativeHandle(ref, () => localRef.current!);

  const { scene: trackScene } = useGLTF('/models/f1_bahrain_lowpoly_circuit.glb');

  useEffect(() => {
    if (!trackScene) return;
    const trackClone = trackScene.clone();
    // Scale track
    trackClone.scale.set(0.25, 0.25, 0.25);

    // Align bottom to y=0.05
    const bbox = new THREE.Box3().setFromObject(trackClone);
    const minY = bbox.min.y;
    const center = bbox.getCenter(new THREE.Vector3());
    trackClone.position.set(
      -center.x,
      -minY + 0.05,
      -center.z
    );
    trackClone.rotation.set(0, 0, 0);

    // Enable shadows
    trackClone.traverse(node => {
      if (node instanceof THREE.Mesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });

    // Add physics ground plane if world is provided
    if (world) {
      // Create multiple collision bodies for better track representation
      const trackSurface = new CANNON.Box(new CANNON.Vec3(25, 0.05, 25));
      const trackBody = new CANNON.Body({ mass: 0 });
      trackBody.addShape(trackSurface);
      trackBody.position.set(0, 0.1, 0); // Just above the visual track bottom
      world.addBody(trackBody);
      
      // Add additional collision bodies for track barriers/walls if needed
      // This helps prevent the car from going off-track
      const barrierHeight = 0.5;
      const barrierThickness = 0.2;
      
      // Left barrier
      const leftBarrier = new CANNON.Box(new CANNON.Vec3(barrierThickness, barrierHeight, 25));
      const leftBarrierBody = new CANNON.Body({ mass: 0 });
      leftBarrierBody.addShape(leftBarrier);
      leftBarrierBody.position.set(-25, barrierHeight, 0);
      world.addBody(leftBarrierBody);
      
      // Right barrier
      const rightBarrier = new CANNON.Box(new CANNON.Vec3(barrierThickness, barrierHeight, 25));
      const rightBarrierBody = new CANNON.Body({ mass: 0 });
      rightBarrierBody.addShape(rightBarrier);
      rightBarrierBody.position.set(25, barrierHeight, 0);
      world.addBody(rightBarrierBody);
    }

    // Add to group
    const parentGroup = localRef.current!;
    parentGroup.add(trackClone);

    // Cleanup
    return () => {
      parentGroup.remove(trackClone);
      trackClone.traverse(node => {
        if (node instanceof THREE.Mesh) {
          node.geometry.dispose();
          if (Array.isArray(node.material)) {
            node.material.forEach(mat => mat.dispose());
          } else {
            node.material.dispose();
          }
        }
      });
    };
  }, [trackScene, world]);

  return <group ref={localRef} {...props} />;
});

Track.displayName = 'Track';

export default Track;
useGLTF.preload('/models/f1_bahrain_lowpoly_circuit.glb');