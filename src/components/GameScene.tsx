"use client";
// src/components/GameScene.tsx
import React, { Suspense } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { Billboard, OrbitControls } from '@react-three/drei';
import { TextureLoader, GridHelper, AxesHelper } from 'three';
import Car from './Car';
import { projects } from '@/data/projects';
import type { Project } from '@/data/projects';

function ProjectBillboard({ project }: { project: Project }) {
  const texture = useLoader(TextureLoader, project.screenshot);
  return (
    <Billboard position={project.position} follow>
      <mesh>
        <planeGeometry args={[4, 2]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </Billboard>
  );
}

export default function GameScene() {
  return (
    <Suspense fallback={null}>
      <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
        <color attach="background" args={['#202025']} />
        <axesHelper args={[5]} />
        <gridHelper args={[200, 50]} />
        {/* Basic lighting and ground */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#888" />
        </mesh>

        {/* Car model */}
        <Car position={[0, 0.1, 0]} scale={[1, 1, 1]} />

        {/* Orbit controls */}
        <OrbitControls />

        {/* Project billboards */}
        {projects.map((proj) => (
          <ProjectBillboard key={proj.slug} project={proj} />
        ))}
      </Canvas>
    </Suspense>
  );
}