"use client";
import dynamic from 'next/dynamic';
import { Canvas } from '@react-three/fiber';
import { useEffect } from 'react';

const GameScene = dynamic(() => import('@/components/GameScene'), { ssr: false });

export default function HomePage() {
  // Add CSS to ensure full screen without scrollbars
  useEffect(() => {
    // Apply styles to html and body
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    
    return () => {
      // Cleanup when component unmounts
      document.documentElement.style.overflow = '';
      document.documentElement.style.margin = '';
      document.documentElement.style.padding = '';
      document.body.style.overflow = '';
      document.body.style.margin = '';
      document.body.style.padding = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full">
      <Canvas
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        shadows
        camera={{ position: [0, 15, 30], fov: 60 }}
        gl={{ 
          powerPreference: 'high-performance',
          antialias: true,
          alpha: false,
          stencil: false,
          depth: true
        }}
      >
        <GameScene />
      </Canvas>
    </div>
  );
}