"use client";
import React, { forwardRef, useRef, useEffect, useImperativeHandle } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Group } from 'three';

// Collision filter groups
const CAR_GROUP = 1 << 0;
const TRACK_GROUP = 1 << 1;

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
      const trackBody = new CANNON.Body({ mass: 0 });
      const trackShape = new CANNON.Box(new CANNON.Vec3(25, 0.1, 25));
      trackBody.addShape(trackShape);
      
      // Position collision at the same level as visual track surface
      trackBody.position.set(0, 0.05 + 0.1, 0); // 0.05 (track bottom) + 0.1 (half box height)
      trackBody.collisionFilterGroup = TRACK_GROUP;
      trackBody.collisionFilterMask = CAR_GROUP;
      world.addBody(trackBody);
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