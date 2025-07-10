// src/components/GameScene.tsx
"use client";
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Html } from '@react-three/drei';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Group } from 'three';

import Car from './Car';
import Track from './Track';
import PhysicsDriverControls from './DriverControls';

interface CameraProps {
  target: React.MutableRefObject<Group | null>;
}

function FollowCamera({ target }: CameraProps) {
  const camera = useThree((state) => state.camera);
  
  useFrame(() => {
    if (!target.current) return;
    
    // F1 game style - chase camera behind the car
    const car = target.current;
    const distance = 15; // Increased from 10
    const height = 6;    // Increased from 4
    
    // Calculate camera position behind the car
    const cameraPosition = new THREE.Vector3(
      car.position.x - Math.sin(car.rotation.y) * distance,
      car.position.y + height,
      car.position.z - Math.cos(car.rotation.y) * distance
    );
    
    // Smooth camera movement
    camera.position.lerp(cameraPosition, 0.1);
    
    // Look at the car
    camera.lookAt(car.position.x, car.position.y + 2, car.position.z);
  });
  
  return null;
}

// First person camera from driver's perspective
function FirstPersonCamera({ target }: CameraProps) {
  const camera = useThree((state) => state.camera);
  
  useFrame(() => {
    if (!target.current) return;
    
    // Driver's perspective - inside the cockpit
    const car = target.current;
    
    // Position camera at driver's eye level
    const cockpitOffset = new THREE.Vector3(0, 1.2, 0.5);
    const worldOffset = cockpitOffset.clone().applyQuaternion(car.quaternion);
    
    const cockpitPosition = car.position.clone().add(worldOffset);
    camera.position.copy(cockpitPosition);
    
    // Look forward based on car rotation
    const lookDirection = new THREE.Vector3(0, 0, 1).applyQuaternion(car.quaternion);
    const lookTarget = cockpitPosition.clone().add(lookDirection.multiplyScalar(50));
    camera.lookAt(lookTarget);
  });
  
  return null;
}

// TV Camera - Wide angle view
function TVCamera({ target }: CameraProps) {
  const camera = useThree((state) => state.camera);
  
  useFrame(() => {
    if (!target.current) return;
    
    // TV broadcast style - higher angle
    const car = target.current;
    const distance = 20;
    const height = 10;
    
    // Calculate TV camera position
    const angle = Date.now() * 0.0003; // Slow rotation
    const cameraPosition = new THREE.Vector3(
      car.position.x + Math.cos(angle) * distance,
      car.position.y + height,
      car.position.z + Math.sin(angle) * distance
    );
    
    camera.position.lerp(cameraPosition, 0.02);
    camera.lookAt(car.position.x, car.position.y + 2, car.position.z);
  });
  
  return null;
}

// Add this new camera component
function FreeCamera() {
  const camera = useThree((state) => state.camera);
  
  // Reset camera position when switching to free mode
  useEffect(() => {
    camera.position.set(0, 15, 30);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />;
}

// Add this component before the main GameScene function
function DebugPhysicsBody({ body }: { body: CANNON.Body }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current && body) {
      meshRef.current.position.copy(body.position as unknown as THREE.Vector3);
      meshRef.current.quaternion.copy(body.quaternion as unknown as THREE.Quaternion);
    }
  });
  
  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 0.4, 2]} />
      <meshBasicMaterial color="red" wireframe />
    </mesh>
  );
}

export default function GameScene() {
  // Remove the unused scene destructuring
  const carRef = useRef<Group>(null);
  const trackRef = useRef<Group>(null);
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);

  // Add time of day state
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'night'>('day');
  const [cameraMode, setCameraMode] = useState<'follow' | 'free' | 'first-person' | 'tv'>('free'); // Start with free camera to debug

  // Set an initial position for the car at the starting line of Bahrain circuit
  const initialCarPosition = useMemo(() => {
    // This positions the car at the start line and properly above the track
    return [12.9 * 0.25, 0.8, 13.5 * 0.25] as [number, number, number]; // Lowered Y from 1.5 to 0.8
  }, []);

  // Physics world
  const world = useMemo(() => {
    const w = new CANNON.World();
    w.gravity.set(0, -9.82, 0); // Use normal gravity
    w.broadphase = new CANNON.SAPBroadphase(w);
    w.allowSleep = true;
    return w;
  }, []);

  // Chassis body - make it smaller to match the visual car
  const chassisBody = useMemo(() => {
    const shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.2, 1)); // Much smaller physics body
    const body = new CANNON.Body({ 
      mass: 150, // Lighter mass
      linearDamping: 0.4,
      angularDamping: 0.8, // Increased angular damping to prevent flipping
      material: new CANNON.Material({ friction: 0.4, restitution: 0.1 })
    });
    body.addShape(shape);
    body.position.set(initialCarPosition[0], initialCarPosition[1], initialCarPosition[2]);
    
    // Start as dynamic body (not static)
    body.type = CANNON.Body.DYNAMIC;
    
    // Add some constraints to prevent excessive rotation
    body.angularVelocity.set(0, 0, 0);
    
    world.addBody(body);
    return body;
  }, [world, initialCarPosition]);

  // Vehicle setup - adjust wheel settings
  const vehicle = useMemo(() => {
    const veh = new CANNON.RaycastVehicle({
      chassisBody,
      indexRightAxis: 0,
      indexUpAxis: 1,
      indexForwardAxis: 2,
    });
    
    const wheelOptions: CANNON.WheelInfoOptions = {
      radius: 0.15, // Smaller wheels
      directionLocal: new CANNON.Vec3(0, -1, 0),
      suspensionStiffness: 40, // Back to 40 for better support
      suspensionRestLength: 0.25, // Fine-tuned suspension length
      axleLocal: new CANNON.Vec3(1, 0, 0),
      chassisConnectionPointLocal: new CANNON.Vec3(),
      maxSuspensionForce: 100000,
      maxSuspensionTravel: 0.25,
      customSlidingRotationalSpeed: -30,
      useCustomSlidingRotationalSpeed: true,
    };
    
    // Adjust wheel positions for smaller car
    const axlePositions = [
      new CANNON.Vec3(-0.4, -0.2, -0.8),  // Front left - lowered connection point
      new CANNON.Vec3(0.4,  -0.2, -0.8),  // Front right
      new CANNON.Vec3(-0.4, -0.2,  0.8),  // Back left
      new CANNON.Vec3(0.4,  -0.2,  0.8),  // Back right
    ];
    
    axlePositions.forEach((pos) => {
      veh.addWheel({ ...wheelOptions, chassisConnectionPointLocal: pos.clone() });
    });
    
    veh.addToWorld(world);
    return veh;
  }, [world, chassisBody]);

  // Toggle camera mode
  const toggleCamera = () => {
    setCameraMode((prev) => {
      console.log('Current camera mode:', prev);
      if (prev === 'follow') return 'first-person';
      if (prev === 'first-person') return 'tv';
      if (prev === 'tv') return 'free';
      return 'follow';
    });
  };

  // Add keyboard handler for camera toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'c') {
        toggleCamera();
      }
      if (e.key.toLowerCase() === 't') {
        setTimeOfDay((prev: 'day' | 'night') => prev === 'day' ? 'night' : 'day');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update physics world
  useFrame((state, delta) => {
    // Step the physics world
    world.step(delta);
    
    // Update car position from physics body
    if (carRef.current && chassisBody) {
      carRef.current.position.copy(chassisBody.position as unknown as THREE.Vector3);
      carRef.current.quaternion.copy(chassisBody.quaternion as unknown as THREE.Quaternion);
      
      // Debug: log car position occasionally
      if (Math.random() < 0.01) {
        console.log('Car position:', carRef.current.position);
        console.log('Physics body position:', chassisBody.position);
      }
    }
  });

  return (
    <>
      {/* Camera - Only render one at a time */}
      {cameraMode === 'follow' && <FollowCamera target={carRef} />}
      {cameraMode === 'first-person' && <FirstPersonCamera target={carRef} />}
      {cameraMode === 'tv' && <TVCamera target={carRef} />}
      {cameraMode === 'free' && <FreeCamera />}
      
      {/* Replace the old DriverControls with PhysicsDriverControls */}
      <PhysicsDriverControls vehicle={vehicle} chassisBody={chassisBody} />
      
      {/* Other components like Track, Car, etc. */}
      <Track ref={trackRef} world={world} />
      <Car ref={carRef} />
      
      {/* Debug: Add dynamic wireframe box to show physics body location */}
      <DebugPhysicsBody body={chassisBody} />
      
      {/* Debug: Add wireframe plane to show ground collision */}
      <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshBasicMaterial color="green" wireframe />
      </mesh>
      
      {/* Lights */}
      <directionalLight ref={directionalLightRef} position={[10, 10, 5]} intensity={1} />
      <ambientLight intensity={0.3} />
      
      {/* Environment - change based on time of day */}
      <Environment preset={timeOfDay === 'day' ? 'sunset' : 'night'} />
      
      {/* HTML overlay for controls */}
      <Html>
        <div className="controls">
          <button onClick={toggleCamera}>Toggle Camera</button>
          <button onClick={() => setTimeOfDay('day')}>Day</button>
          <button onClick={() => setTimeOfDay('night')}>Night</button>
        </div>
      </Html>

      {/* Instructions overlay */}
      <Html fullscreen>
        <div className="fixed bottom-4 left-4 bg-black/70 text-white p-3 rounded">
          <p>WASD or Arrow Keys to drive</p>
          <p>Press C to change camera: {cameraMode}</p>
          <p>Press T to toggle time of day: {timeOfDay}</p>
          <p>Free camera: Use mouse to pan/zoom/rotate</p>
          <p>Car position: {carRef.current ? 
            `${carRef.current.position.x.toFixed(1)}, ${carRef.current.position.y.toFixed(1)}, ${carRef.current.position.z.toFixed(1)}` 
            : 'Loading...'}</p>
        </div>
      </Html>
    </>
  );
};
