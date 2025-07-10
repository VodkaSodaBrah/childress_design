"use client";
import { useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as CANNON from 'cannon-es';

interface PhysicsDriverControlsProps {
  vehicle: CANNON.RaycastVehicle;
  chassisBody: CANNON.Body;
}

export default function PhysicsDriverControls({ vehicle, chassisBody }: PhysicsDriverControlsProps) {
  const [keys, setKeys] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false
  });
  
  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          setKeys(prev => ({ ...prev, forward: true }));
          break;
        case 's':
        case 'arrowdown':
          setKeys(prev => ({ ...prev, backward: true }));
          break;
        case 'a':
        case 'arrowleft':
          setKeys(prev => ({ ...prev, left: true }));
          break;
        case 'd':
        case 'arrowright':
          setKeys(prev => ({ ...prev, right: true }));
          break;
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          setKeys(prev => ({ ...prev, forward: false }));
          break;
        case 's':
        case 'arrowdown':
          setKeys(prev => ({ ...prev, backward: false }));
          break;
        case 'a':
        case 'arrowleft':
          setKeys(prev => ({ ...prev, left: false }));
          break;
        case 'd':
        case 'arrowright':
          setKeys(prev => ({ ...prev, right: false }));
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Apply physics-based controls
  useFrame(() => {
    if (!vehicle || !chassisBody) return;
    
    const maxSteerVal = Math.PI / 8; // Max steering angle
    const maxForce = 400; // Engine force
    
    // Reset forces
    vehicle.setSteeringValue(0, 0);
    vehicle.setSteeringValue(0, 1);
    vehicle.applyEngineForce(0, 2);
    vehicle.applyEngineForce(0, 3);
    
    // Apply steering
    if (keys.left) {
      vehicle.setSteeringValue(maxSteerVal, 0);
      vehicle.setSteeringValue(maxSteerVal, 1);
    }
    if (keys.right) {
      vehicle.setSteeringValue(-maxSteerVal, 0);
      vehicle.setSteeringValue(-maxSteerVal, 1);
    }
    
    // Apply engine force
    if (keys.forward) {
      vehicle.applyEngineForce(maxForce, 2);
      vehicle.applyEngineForce(maxForce, 3);
    }
    if (keys.backward) {
      vehicle.applyEngineForce(-maxForce / 2, 2);
      vehicle.applyEngineForce(-maxForce / 2, 3);
    }
  });
  
  return null;
}