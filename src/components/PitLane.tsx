// src/components/PitLane.tsx
"use client";
import React, { useState } from 'react';
import { Text, Html } from '@react-three/drei';

interface PitBox {
  id: string;
  title: string;
  content: string;
}

interface PitLaneProps {
  carPosition: { x: number; z: number };  // Remove optional as it's always set
}

const pitBoxes: PitBox[] = [
  { 
    id: 'contact',
    title: 'Contact Us',
    content: 'Email: hello@childressdigitalstudio.com\nPhone: (555) 123-4567'
  },
  { 
    id: 'services',
    title: 'Services',
    content: 'Web Development\n3D Graphics\nUI/UX Design\nMobile Apps'
  },
  { 
    id: 'about',
    title: 'About Us',
    content: 'Childress Digital Studio creates cutting-edge digital experiences, blending creativity with technical expertise.'
  },
  { 
    id: 'clients',
    title: 'Our Clients',
    content: 'Fortune 500 Companies\nStartups\nNon-profits\nEducational Institutions'
  }
];

export default function PitLane({ carPosition }: PitLaneProps) {
  const [activeBox, setActiveBox] = useState<PitBox | null>(null);
  
  // Check if car is in a pit box area
  React.useEffect(() => {
    if (!carPosition) return;
    
    // Check each pit box area
    const boxIndex = pitBoxes.findIndex((_, i) => {
      const z = -10 + i * 5;
      return (
        carPosition.x > 22 && 
        carPosition.x < 28 && 
        carPosition.z > z - 2.5 && 
        carPosition.z < z + 2.5
      );
    });
    
    setActiveBox(boxIndex >= 0 ? pitBoxes[boxIndex] : null);
  }, [carPosition]);
  
  return (
    <group position={[25, 0, 0]}>
      {pitBoxes.map((box, i) => {
        const z = -10 + i * 5;
        return (
          <group key={box.id} position={[0, 0, z]}>
            <Text position={[0, 1, 0]} fontSize={0.5} color="white" anchorY="bottom">
              {box.title}
            </Text>
            
            {activeBox === box && (
              <Html position={[0, 3, 0]} transform>
                <div className="bg-white p-4 rounded-lg shadow-lg w-64">
                  <h3 className="text-xl font-bold mb-2">{activeBox.title}</h3>
                  <p className="whitespace-pre-line">{activeBox.content}</p>
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}