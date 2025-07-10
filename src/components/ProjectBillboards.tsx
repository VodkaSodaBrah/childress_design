// src/components/ProjectBillboards.tsx
"use client";
import React, { useState } from 'react';
import { Billboard, Text, useTexture, Html } from '@react-three/drei';
import { projects, Project } from '@/data/projects';

interface RenderTargetProps {
  url: string;
}

export default function ProjectBillboards() {
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  
  return (
    <group>
      {projects.map((project, index) => {
        // Position billboards around the track
        const angle = (index / projects.length) * Math.PI * 2;
        const radius = 30;
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;
        
        return (
          <group key={project.slug} position={[x, 2, z]} rotation={[0, -angle + Math.PI, 0]}>
            <Billboard 
              follow={false}
              onPointerEnter={() => setActiveProject(project)}
              onPointerLeave={() => setActiveProject(null)}
            >
              <mesh>
                <planeGeometry args={[8, 4]} />
                <meshBasicMaterial color="white" />
              </mesh>
              
              <Text position={[0, 2.5, 0.1]} fontSize={0.8} color="black">
                {project.title}
              </Text>
              
              <mesh position={[0, 0, 0.1]}>
                <planeGeometry args={[7, 3]} />
                <meshBasicMaterial>
                  <RenderTarget url={project.screenshot} />
                </meshBasicMaterial>
              </mesh>
            </Billboard>
            
            {activeProject === project && (
              <Html position={[0, -3, 0]} transform>
                <div className="bg-black/80 text-white p-4 rounded-lg">
                  <h3 className="text-xl font-bold">{activeProject.title}</h3>
                  <a 
                    href={activeProject.liveUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    Visit Project
                  </a>
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}

function RenderTarget({ url }: RenderTargetProps) {
  const texture = useTexture(url);
  return <primitive object={texture} />;
}