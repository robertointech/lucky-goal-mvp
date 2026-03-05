"use client";

import { useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment } from "@react-three/drei";
import * as THREE from "three";
import type { Direction } from "@/types/game";

// --- Ball Component ---
function Ball({
  direction,
  kicked,
  onAnimationEnd,
}: {
  direction: Direction | null;
  kicked: boolean;
  onAnimationEnd: () => void;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  const [progress, setProgress] = useState(0);

  // Reset on new kick
  useEffect(() => {
    if (kicked) setProgress(0);
  }, [kicked]);

  useFrame((_, delta) => {
    if (!kicked || !direction) return;

    setProgress((p) => {
      const next = Math.min(p + delta * 2.5, 1);
      if (next >= 1 && p < 1) {
        setTimeout(onAnimationEnd, 0);
      }
      return next;
    });

    const t = progress;
    const xTarget = direction === "left" ? -1.8 : direction === "right" ? 1.8 : 0;
    ref.current.position.x = THREE.MathUtils.lerp(0, xTarget, t);
    ref.current.position.z = THREE.MathUtils.lerp(0, -6, t);
    // Arc trajectory
    ref.current.position.y = 0.3 + Math.sin(t * Math.PI) * 1.5;
    // Spin
    ref.current.rotation.x -= delta * 12;
  });

  return (
    <mesh ref={ref} position={[0, 0.3, 0]} castShadow>
      <sphereGeometry args={[0.3, 32, 32]} />
      <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.1} />
      {/* Pentagons pattern via emissive map simulation */}
      <meshStandardMaterial
        color="#ffffff"
        roughness={0.4}
        metalness={0.05}
        emissive="#111111"
      />
    </mesh>
  );
}

// --- Goalkeeper ---
function Goalkeeper({
  diveDirection,
  diving,
}: {
  diveDirection: Direction | null;
  diving: boolean;
}) {
  const ref = useRef<THREE.Group>(null!);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (diving) setProgress(0);
  }, [diving]);

  useFrame((_, delta) => {
    if (!diving || !diveDirection) return;

    setProgress((p) => Math.min(p + delta * 3, 1));
    const t = progress;

    if (diveDirection === "left") {
      ref.current.position.x = THREE.MathUtils.lerp(0, -2, t);
      ref.current.rotation.z = THREE.MathUtils.lerp(0, Math.PI / 3, t);
    } else if (diveDirection === "right") {
      ref.current.position.x = THREE.MathUtils.lerp(0, 2, t);
      ref.current.rotation.z = THREE.MathUtils.lerp(0, -Math.PI / 3, t);
    } else {
      // center: jump up
      ref.current.position.y = THREE.MathUtils.lerp(0, 0.8, Math.sin(t * Math.PI));
    }
  });

  return (
    <group ref={ref} position={[0, 0, -6.5]}>
      {/* Body */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <capsuleGeometry args={[0.25, 0.8, 8, 16]} />
        <meshStandardMaterial color="#FFD700" roughness={0.5} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.65, 0]} castShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#FFB366" roughness={0.6} />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.45, 1.2, 0]} rotation={[0, 0, Math.PI / 6]} castShadow>
        <capsuleGeometry args={[0.08, 0.5, 4, 8]} />
        <meshStandardMaterial color="#FFD700" roughness={0.5} />
      </mesh>
      <mesh position={[0.45, 1.2, 0]} rotation={[0, 0, -Math.PI / 6]} castShadow>
        <capsuleGeometry args={[0.08, 0.5, 4, 8]} />
        <meshStandardMaterial color="#FFD700" roughness={0.5} />
      </mesh>
      {/* Gloves */}
      <mesh position={[-0.65, 1.5, 0]} castShadow>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color="#00FF88" roughness={0.3} />
      </mesh>
      <mesh position={[0.65, 1.5, 0]} castShadow>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color="#00FF88" roughness={0.3} />
      </mesh>
    </group>
  );
}

// --- Goal Posts ---
function GoalPosts() {
  const postMaterial = (
    <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.8} />
  );
  const postRadius = 0.08;

  return (
    <group position={[0, 0, -7]}>
      {/* Left post */}
      <mesh position={[-3, 1.2, 0]} castShadow>
        <cylinderGeometry args={[postRadius, postRadius, 2.4, 16]} />
        {postMaterial}
      </mesh>
      {/* Right post */}
      <mesh position={[3, 1.2, 0]} castShadow>
        <cylinderGeometry args={[postRadius, postRadius, 2.4, 16]} />
        {postMaterial}
      </mesh>
      {/* Crossbar */}
      <mesh position={[0, 2.4, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[postRadius, postRadius, 6, 16]} />
        {postMaterial}
      </mesh>
      {/* Net - back */}
      <mesh position={[0, 1.2, -1.2]} receiveShadow>
        <planeGeometry args={[6, 2.4]} />
        <meshStandardMaterial
          color="#cccccc"
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          wireframe
        />
      </mesh>
      {/* Net - top */}
      <mesh position={[0, 2.4, -0.6]} rotation={[Math.PI / 4, 0, 0]} receiveShadow>
        <planeGeometry args={[6, 1.7]} />
        <meshStandardMaterial
          color="#cccccc"
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          wireframe
        />
      </mesh>
    </group>
  );
}

// --- Pitch / Ground ---
function Pitch() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -3]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#1a8a3a" roughness={0.9} />
    </mesh>
  );
}

// --- Penalty Spot ---
function PenaltySpot() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
      <circleGeometry args={[0.12, 16]} />
      <meshStandardMaterial color="#ffffff" />
    </mesh>
  );
}

// --- Direction Zones (clickable) ---
function DirectionZones({
  onSelect,
  disabled,
  selected,
}: {
  onSelect: (d: Direction) => void;
  disabled: boolean;
  selected: Direction | null;
}) {
  const zones: { dir: Direction; x: number }[] = [
    { dir: "left", x: -1.8 },
    { dir: "center", x: 0 },
    { dir: "right", x: 1.8 },
  ];

  return (
    <group position={[0, 0, -5]}>
      {zones.map(({ dir, x }) => (
        <mesh
          key={dir}
          position={[x, 1, 0]}
          onClick={() => !disabled && onSelect(dir)}
          onPointerOver={(e) => {
            if (!disabled) {
              (e.object as THREE.Mesh).material = new THREE.MeshStandardMaterial({
                color: "#00FF88",
                transparent: true,
                opacity: 0.4,
              });
              document.body.style.cursor = "pointer";
            }
          }}
          onPointerOut={(e) => {
            (e.object as THREE.Mesh).material = new THREE.MeshStandardMaterial({
              color: selected === dir ? "#00FF88" : "#ffffff",
              transparent: true,
              opacity: selected === dir ? 0.3 : 0.1,
            });
            document.body.style.cursor = "auto";
          }}
        >
          <planeGeometry args={[1.6, 2.2]} />
          <meshStandardMaterial
            color={selected === dir ? "#00FF88" : "#ffffff"}
            transparent
            opacity={selected === dir ? 0.3 : 0.1}
          />
        </mesh>
      ))}
    </group>
  );
}

// --- Main Exported Component ---
interface PenaltySceneProps {
  onDirectionSelect: (dir: Direction) => void;
  onKickComplete: (scored: boolean) => void;
  selectedDirection: Direction | null;
  kicked: boolean;
  goalkeeperDirection: Direction | null;
  result: "goal" | "saved" | null;
}

function Scene({
  onDirectionSelect,
  onKickComplete,
  selectedDirection,
  kicked,
  goalkeeperDirection,
  result,
}: PenaltySceneProps) {
  const handleBallAnimEnd = () => {
    // After ball animation, determine if scored
    if (result !== null) {
      onKickComplete(result === "goal");
    }
  };

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <Pitch />
      <PenaltySpot />
      <GoalPosts />
      <Goalkeeper diveDirection={goalkeeperDirection} diving={kicked} />
      <Ball
        direction={selectedDirection}
        kicked={kicked}
        onAnimationEnd={handleBallAnimEnd}
      />
      {!kicked && (
        <DirectionZones
          onSelect={onDirectionSelect}
          disabled={kicked}
          selected={selectedDirection}
        />
      )}
      <ContactShadows
        position={[0, 0.01, -3]}
        opacity={0.4}
        scale={20}
        blur={2}
        far={10}
        resolution={256}
      />
      <Environment preset="city" />
    </>
  );
}

export default function PenaltyScene(props: PenaltySceneProps) {
  return (
    <div className="w-full h-[350px] md:h-[450px] rounded-xl overflow-hidden">
      <Canvas
        shadows
        camera={{ position: [0, 3, 5], fov: 50 }}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <Scene {...props} />
        </Suspense>
      </Canvas>
    </div>
  );
}
