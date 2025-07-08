"use client";
// src/components/GameScene.tsx
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { GridHelper, AxesHelper } from 'three';
import Car from './Car';

export default function GameScene() {
  return (
    <Canvas>
      <color attach="background" args={['#202025']} />
      <axesHelper args={[5]} />
      <gridHelper args={[200, 50]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 7]} intensity={1} />
      <Suspense fallback={null}>
        <Car position={[0, 0, 0]} />
      </Suspense>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#888" />
      </mesh>
    </Canvas>
  );
}