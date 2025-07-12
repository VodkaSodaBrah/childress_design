// src/components/GameScene.tsx
"use client";
import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Raycaster, Vector3 } from 'three';
import * as CANNON from 'cannon-es';
import { Group } from 'three';

// Collision filter groups
const CAR_GROUP = 1 << 0;
const TRACK_GROUP = 1 << 1;
const BARRIER_GROUP = 1 << 2;

import Car from './Car';
import Track from './Track';
import PhysicsDriverControls from './DriverControls';
import PositionHelper from './PositionHelper';

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
function DebugPhysicsBody({ body }: { body: CANNON.Body | null }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current && body) {
      meshRef.current.position.copy(body.position as unknown as THREE.Vector3);
      meshRef.current.quaternion.copy(body.quaternion as unknown as THREE.Quaternion);
    }
  });

  if (!body) return null;

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 0.4, 2]} />
      <meshBasicMaterial color="red" wireframe />
    </mesh>
  );
}

export default function GameScene() {
  const carRef = useRef<Group>(null);
  const trackRef = useRef<Group>(null);
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);

  const [timeOfDay, setTimeOfDay] = useState<'day' | 'night'>('day');
  const [cameraMode, setCameraMode] = useState<'follow' | 'free' | 'first-person' | 'tv'>('free');
  const [trackY, setTrackY] = useState<number | null>(null);
  
  // Track positioning data
  const [trackData, setTrackData] = useState<{
    startPosition: [number, number, number];
    trackSurfaceY: number;
  } | null>(null);

  // Static spawn position - don't recalculate this constantly
  const spawnPosition = useMemo(() => {
    if (!trackData) {
      return [3.225, 2.0, 3.375] as [number, number, number];
    }
    return trackData.startPosition;
  }, [trackData]);

  // Calculate proper car positioning - lift slightly to prevent sinking
  const initialCarPosition = useMemo(() => {
    if (!trackData) {
      // Fallback position while track data loads
      return [3.225, 2.0, 3.375] as [number, number, number];
    }
    
    // Use raycast result if available, otherwise fall back to trackData
    const actualTrackSurface = trackY ?? trackData.trackSurfaceY;
    
    const wheelRadius = 0.26;
    const chassisHeight = 0.15; // Half height of chassis collision box
    const clearance = 0.05; // Small clearance to prevent sinking
    
    // Lift the physics body slightly to ensure wheels sit on top of track
    const carY = actualTrackSurface + wheelRadius + chassisHeight + clearance;
    
    console.log("Track surface used:", actualTrackSurface);
    console.log("Chassis center positioned at:", carY);
    console.log("Wheels will be at:", carY - chassisHeight - clearance, "to", carY - chassisHeight - wheelRadius - clearance);
    
    return [
      spawnPosition[0],
      carY,
      spawnPosition[2]
    ] as [number, number, number];
  }, [trackData, trackY, spawnPosition]);

  // Physics world - create once, stable
  const world = useMemo(() => {
    const w = new CANNON.World();
    w.gravity.set(0, -9.82, 0);
    w.broadphase = new CANNON.SAPBroadphase(w);
    w.allowSleep = true;
    w.defaultContactMaterial.friction = 0.4;
    w.defaultContactMaterial.restitution = 0.0;
    
    return w;
  }, []);

  // Add ground plane when track data is available
  useEffect(() => {
    if (!trackData || !world) return;
    
    // Use raycast surface if available, otherwise bbox
    const groundHeight = trackY ?? trackData.trackSurfaceY;
    const groundMaterial = new CANNON.Material('ground');
    groundMaterial.friction = 0.8;
    groundMaterial.restitution = 0.0;
    
    const groundBody = new CANNON.Body({ mass: 0, material: groundMaterial });
    groundBody.addShape(new CANNON.Plane());
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    groundBody.position.set(0, groundHeight, 0);
    groundBody.collisionFilterGroup = TRACK_GROUP;
    groundBody.collisionFilterMask = CAR_GROUP;
    
    world.addBody(groundBody);
    
    console.log("Ground plane positioned at Y:", groundHeight);
    
    return () => {
      world.removeBody(groundBody);
    };
  }, [trackData, world, trackY]);

  // Handle track data callback - use useCallback to prevent recreation
  const handleTrackData = useCallback((data: { startPosition: [number, number, number]; trackSurfaceY: number }) => {
    console.log("Received track data:", data);
    setTrackData(data);
  }, []);

  // Raycast for track surface - use the static spawn position, not the calculated car position
  useEffect(() => {
    if (!trackRef.current || !spawnPosition) return;
    
    const [spawnX, , spawnZ] = spawnPosition;
    
    // Cast a ray straight down from above the spawn point
    const ray = new Raycaster(
      new Vector3(spawnX, 50, spawnZ),
      new Vector3(0, -1, 0)
    );
    
    // Gather all mesh descendants of the track
    const trackMeshes: THREE.Mesh[] = [];
    trackRef.current.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        trackMeshes.push(obj as THREE.Mesh);
      }
    });
    
    // Intersect ray against every track mesh
    const hits = ray.intersectObjects(trackMeshes, false);
    if (hits.length > 0) {
      // hits[0] is the closest intersection (highest point)
      const newTrackY = hits[0].point.y;
      console.log("Raycast found track surface at Y:", newTrackY);
      setTrackY(newTrackY);
    }
  }, [trackRef.current, spawnPosition]); // Use spawnPosition instead of initialCarPosition

  // Chassis body - more stable configuration
  const chassisBody = useMemo(() => {
    if (!trackData) return null;
    
    const shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.15, 1));
    const chassisMaterial = new CANNON.Material('chassis');
    chassisMaterial.friction = 0.4;
    chassisMaterial.restitution = 0.1;
    
    const body = new CANNON.Body({ 
      mass: 200,
      linearDamping: 0.1,
      angularDamping: 0.5,
      material: chassisMaterial
    });
    
    body.addShape(shape);
    body.position.set(initialCarPosition[0], initialCarPosition[1], initialCarPosition[2]);
    body.quaternion.setFromEuler(0, Math.PI, 0, 'XYZ');
    body.type = CANNON.Body.DYNAMIC;
    body.collisionFilterGroup = CAR_GROUP;
    body.collisionFilterMask = TRACK_GROUP | BARRIER_GROUP;
    
    body.fixedRotation = false;
    body.updateMassProperties();
    
    world.addBody(body);
    return body;
  }, [world, initialCarPosition, trackData]);

  // Vehicle with better wheel physics
  const vehicle = useMemo(() => {
    if (!chassisBody) return null;
    
    const veh = new CANNON.RaycastVehicle({
      chassisBody,
      indexRightAxis: 0,
      indexUpAxis: 1,
      indexForwardAxis: 2,
    });
    
    const wheelRadius = 0.26;
    const wheelOptions: CANNON.WheelInfoOptions = {
      radius: wheelRadius,
      directionLocal: new CANNON.Vec3(0, -1, 0),
      suspensionStiffness: 50, // Increased stiffness to prevent sinking
      suspensionRestLength: 0.1, // Shorter suspension
      axleLocal: new CANNON.Vec3(1, 0, 0),
      chassisConnectionPointLocal: new CANNON.Vec3(),
      maxSuspensionForce: 150000, // Increased force
      maxSuspensionTravel: 0.1, // Less travel
      customSlidingRotationalSpeed: -30,
      useCustomSlidingRotationalSpeed: true,
      frictionSlip: 2.0,
      rollInfluence: 0.1,
    };
    
    // Wheel positions - wheels hang directly below chassis edges
    const wheelHangDistance = 0.1; // Reduced hang distance
    const axlePositions = [
      new CANNON.Vec3(-0.35, -wheelHangDistance, -0.7),  // Front left
      new CANNON.Vec3(0.35,  -wheelHangDistance, -0.7),  // Front right
      new CANNON.Vec3(-0.35, -wheelHangDistance,  0.7),  // Back left
      new CANNON.Vec3(0.35,  -wheelHangDistance,  0.7),  // Back right
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
    // Limit delta to prevent large jumps
    const maxDelta = 1 / 60; // Cap at 60fps equivalent
    const physicsDelta = Math.min(delta, maxDelta);
    
    // Step the physics world with fixed timestep
    world.step(physicsDelta);

    // Update car position from physics body
    if (carRef.current && chassisBody) {
      // Get the target position from physics
      const targetPosition = new THREE.Vector3().copy(chassisBody.position as never);
      const targetQuaternion = new THREE.Quaternion().copy(chassisBody.quaternion as never);
      
      // Apply the visual car offset to match the physics body
      // Fine-tuned offset to get the car sitting properly on track
      const visualOffset = new THREE.Vector3(0, -0.74, 0); // Changed from -0.6 to -0.7
      targetPosition.add(visualOffset);
      
      carRef.current.position.lerp(targetPosition, 0.8);
      carRef.current.quaternion.slerp(targetQuaternion, 0.8);
      
      // Debug: log car position occasionally
      if (Math.random() < 0.005) { // Less frequent logging
        console.log('Car Y position:', carRef.current.position.y.toFixed(3));
        console.log('Physics body Y:', chassisBody.position.y.toFixed(3));
        console.log('Offset applied:', visualOffset.y);
      }
    }
  });

  // Add physics contact debugging with proper typing
  useEffect(() => {
    if (!world || !chassisBody) return;
    
    const onContact = (event: { bodyA: CANNON.Body; bodyB: CANNON.Body; contact: { ri: CANNON.Vec3 } }) => {
      if (event.bodyA === chassisBody || event.bodyB === chassisBody) {
        console.log("Car contact detected at Y:", event.contact.ri.y + event.bodyA.position.y);
      }
    };
    
    world.addEventListener('beginContact', onContact);
    return () => {
      world.removeEventListener('beginContact', onContact);
    };
  }, [world, chassisBody]);

  return (
    <>
      {/* Cameras */}
      {cameraMode === 'follow' && <FollowCamera target={carRef} />}
      {cameraMode === 'first-person' && <FirstPersonCamera target={carRef} />}
      {cameraMode === 'tv' && <TVCamera target={carRef} />}
      {cameraMode === 'free' && <FreeCamera />}
      
      {/* Only render PhysicsDriverControls when vehicle and chassisBody are available */}
      {vehicle && chassisBody && (
        <PhysicsDriverControls vehicle={vehicle} chassisBody={chassisBody} />
      )}
      
      {/* Helper component to get track positioning data */}
      <PositionHelper onTrackDataFound={handleTrackData} />
      
      <Track ref={trackRef} world={world} />
      <Car ref={carRef} />
      
      {/* Only render debug component when chassisBody exists */}
      <DebugPhysicsBody body={chassisBody} />
      
      {/* Enhanced Debug Visualizations */}
      {trackData && (
        <>
          {/* Ground plane visualization - use actual surface */}
          <mesh position={[0, trackY ?? trackData.trackSurfaceY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[50, 50]} />
            <meshBasicMaterial color="green" wireframe />
          </mesh>
          
          {/* Show both bbox and raycast surfaces for comparison */}
          <mesh position={[0, trackData.trackSurfaceY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[30, 30]} />
            <meshBasicMaterial color="red" wireframe />
          </mesh>
          
          {/* Starting position marker */}
          <mesh position={trackData.startPosition}>
            <boxGeometry args={[0.5, 0.1, 0.5]} />
            <meshBasicMaterial color="blue" />
          </mesh>
          
          {/* Wheel contact point indicators - show actual wheel positions */}
          {chassisBody && (
            <>
              {/* Front left wheel */}
              <mesh position={[
                chassisBody.position.x - 0.35,
                chassisBody.position.y - 0.15 - 0.26, // chassis center - wheel hang - wheel radius
                chassisBody.position.z - 0.7
              ]}>
                <cylinderGeometry args={[0.26, 0.26, 0.02]} />
                <meshBasicMaterial color="yellow" wireframe />
              </mesh>
              
              {/* Front right wheel */}
              <mesh position={[
                chassisBody.position.x + 0.35,
                chassisBody.position.y - 0.15 - 0.26,
                chassisBody.position.z - 0.7
              ]}>
                <cylinderGeometry args={[0.26, 0.26, 0.02]} />
                <meshBasicMaterial color="yellow" wireframe />
              </mesh>
              
              {/* Back left wheel */}
              <mesh position={[
                chassisBody.position.x - 0.35,
                chassisBody.position.y - 0.15 - 0.26,
                chassisBody.position.z + 0.7
              ]}>
                <cylinderGeometry args={[0.26, 0.26, 0.02]} />
                <meshBasicMaterial color="yellow" wireframe />
              </mesh>
              
              {/* Back right wheel */}
              <mesh position={[
                chassisBody.position.x + 0.35,
                chassisBody.position.y - 0.15 - 0.26,
                chassisBody.position.z + 0.7
              ]}>
                <cylinderGeometry args={[0.26, 0.26, 0.02]} />
                <meshBasicMaterial color="yellow" wireframe />
              </mesh>
            </>
          )}
          
          {/* Ideal car position indicator - use actual surface */}
          <mesh position={[
            trackData.startPosition[0],
            (trackY ?? trackData.trackSurfaceY) + 0.26 + 0.15 + 0.05, // wheel + chassis + clearance
            trackData.startPosition[2]
          ]}>
            <boxGeometry args={[1, 0.3, 2]} />
            <meshBasicMaterial color="orange" wireframe />
          </mesh>
        </>
      )}
      
      {/* Lights */}
      <directionalLight ref={directionalLightRef} position={[10, 10, 5]} intensity={1} />
      <ambientLight intensity={0.3} />
      
      {/* Environment - change based on time of day */}
      <Environment preset={timeOfDay === 'day' ? 'sunset' : 'night'} />
      
      {/* HTML overlay for controls */}
      <Html fullscreen>
        <div className="fixed bottom-4 left-4 z-10 flex space-x-2">
          <button onClick={toggleCamera}>Toggle Camera</button>
          <button onClick={() => setTimeOfDay('day')}>Day</button>
          <button onClick={() => setTimeOfDay('night')}>Night</button>
        </div>
      </Html>

      {/* Enhanced Instructions overlay */}
      <Html fullscreen>
        <div className="fixed bottom-4 left-4 bg-black/70 text-white p-3 rounded text-xs">
          <p>WASD or Arrow Keys to drive</p>
          <p>Press C to change camera: {cameraMode}</p>
          <p>Press T to toggle time of day: {timeOfDay}</p>
          <p>Car visual: {carRef.current ? 
            `${carRef.current.position.x.toFixed(1)}, ${carRef.current.position.y.toFixed(1)}, ${carRef.current.position.z.toFixed(1)}` 
            : 'Loading...'}</p>
          <p>Physics body: {chassisBody ? 
            `${chassisBody.position.x.toFixed(1)}, ${chassisBody.position.y.toFixed(1)}, ${chassisBody.position.z.toFixed(1)}` 
            : 'Loading...'}</p>
          <p style={{color: 'red'}}>Track surface (bbox): {trackData?.trackSurfaceY.toFixed(3) ?? 'Loading...'}</p>
          <p style={{color: 'green'}}>Track surface (raycast): {trackY?.toFixed(3) ?? 'Not found'}</p>
          <p style={{color: 'yellow'}}>Using surface: {(trackY ?? trackData?.trackSurfaceY)?.toFixed(3) ?? 'N/A'}</p>
          <p>Calculated chassis Y: {trackY ? (trackY + 0.26 + 0.15 + 0.05).toFixed(3) : 'N/A'}</p>
          <p>Expected visual car Y: {trackY ? (trackY + 0.26 + 0.15 + 0.05 - 0.7).toFixed(3) : 'N/A'}</p>
          <p>Wheel bottom should be at: {trackY ? (trackY + 0.05).toFixed(3) : 'N/A'}</p>
          <p>Visual vs Physics Y diff: {carRef.current && chassisBody ? 
            `${Math.abs(carRef.current.position.y - chassisBody.position.y).toFixed(3)}` 
            : 'N/A'}</p>
          <p style={{color: 'cyan'}}>Model offset: -0.7, Clearance: +0.05</p>
        </div>
      </Html>
    </>
  );
};

