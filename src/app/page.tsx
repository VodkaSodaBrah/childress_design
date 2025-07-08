"use client";
// src/components/GameScene.tsx
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { GridHelper, AxesHelper } from 'three';

function Box() {
  const mesh = useRef();

  useFrame(() => {
    if (mesh.current) {
      mesh.current.rotation.x += 0.01;
      mesh.current.rotation.y += 0.01;
    }
  });

  return (
    <mesh ref={mesh} position={[0, 1, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  );
}

export default function GameScene() {
  return (
    <Canvas>
      <color attach="background" args={['#202025']} />
      <axesHelper args={[5]} />
      <gridHelper args={[200, 50]} />
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <Box />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#888" />
      </mesh>
    </Canvas>
  );
}
