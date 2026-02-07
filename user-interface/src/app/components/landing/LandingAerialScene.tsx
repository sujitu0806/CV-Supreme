"use client";

import { useRef } from "react";
import type { Group } from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import type { Shot3D } from "../../data/mock";

/** Ping pong table: 1.525m × 2.74m (ITTF standard) */
const TABLE_WIDTH = 1.525;
const TABLE_LENGTH = 2.74;

function toThreeCoords(x: number, y: number) {
  return {
    x: x - TABLE_WIDTH / 2,
    z: y - TABLE_LENGTH / 2,
  };
}

const BOARD_OPACITY = 0.7;

function TableGrid() {
  const gridSize = 0.22;
  const halfW = TABLE_WIDTH / 2;
  const halfL = TABLE_LENGTH / 2;
  const lines: React.ReactNode[] = [];

  for (let i = 0; i <= TABLE_WIDTH / gridSize; i++) {
    const x = i * gridSize - halfW;
    lines.push(
      <Line
        key={`v-${i}`}
        points={[[x, 0.02, -halfL], [x, 0.02, halfL]]}
        color="#57534e"
        lineWidth={1.2}
        opacity={BOARD_OPACITY}
        transparent
      />
    );
  }
  for (let i = 0; i <= TABLE_LENGTH / gridSize; i++) {
    const z = i * gridSize - halfL;
    lines.push(
      <Line
        key={`h-${i}`}
        points={[[-halfW, 0.02, z], [halfW, 0.02, z]]}
        color="#57534e"
        lineWidth={1.2}
        opacity={BOARD_OPACITY}
        transparent
      />
    );
  }

  return <group>{lines}</group>;
}

function TableSurface() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[TABLE_WIDTH, TABLE_LENGTH]} />
      <meshStandardMaterial color="#fef3c7" transparent opacity={BOARD_OPACITY} />
    </mesh>
  );
}

function TableBorder() {
  const h = TABLE_WIDTH / 2;
  const v = TABLE_LENGTH / 2;
  const w = 0.02;
  return (
    <group>
      <mesh position={[-h - w / 2, 0.01, 0]} receiveShadow>
        <boxGeometry args={[w, 0.02, TABLE_LENGTH + w * 2]} />
        <meshStandardMaterial color="#fb923c" transparent opacity={BOARD_OPACITY} />
      </mesh>
      <mesh position={[h + w / 2, 0.01, 0]} receiveShadow>
        <boxGeometry args={[w, 0.02, TABLE_LENGTH + w * 2]} />
        <meshStandardMaterial color="#fb923c" transparent opacity={BOARD_OPACITY} />
      </mesh>
      <mesh position={[0, 0.01, -v - w / 2]} receiveShadow>
        <boxGeometry args={[TABLE_WIDTH + w * 2, 0.02, w]} />
        <meshStandardMaterial color="#fb923c" transparent opacity={BOARD_OPACITY} />
      </mesh>
      <mesh position={[0, 0.01, v + w / 2]} receiveShadow>
        <boxGeometry args={[TABLE_WIDTH + w * 2, 0.02, w]} />
        <meshStandardMaterial color="#fb923c" transparent opacity={BOARD_OPACITY} />
      </mesh>
    </group>
  );
}

function Net() {
  return (
    <mesh position={[0, 0.05, 0]} receiveShadow>
      <boxGeometry args={[TABLE_WIDTH + 0.04, 0.02, 0.02]} />
      <meshStandardMaterial color="#78716c" transparent opacity={BOARD_OPACITY} />
    </mesh>
  );
}

const BALL_APPEAR_DURATION = 0.4;
const BALL_STAGGER = 0.4;

function AppearingBall({ shot, index }: { shot: Shot3D; index: number }) {
  const groupRef = useRef<Group>(null);
  const startTime = useRef<number | null>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    if (startTime.current === null) startTime.current = state.clock.elapsedTime;
    const delay = index === 0 ? 0 : index * BALL_STAGGER;
    const elapsed = state.clock.elapsedTime - startTime.current - delay;
    const t = Math.min(1, Math.max(0, elapsed / BALL_APPEAR_DURATION));
    const scale = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // ease-out quad
    groupRef.current.scale.setScalar(scale);
  });

  const { x, z } = toThreeCoords(shot.x, shot.y);
  const isYou = shot.player === "you";
  const color = shot.won ? "#22c55e" : "#ef4444";
  const opponentColor = shot.won ? "#15803d" : "#b91c1c";
  const radius = 0.045;

  return (
    <group ref={groupRef} position={[x, radius, z]}>
      {isYou ? (
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[radius, 20, 20]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ) : (
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[radius * 0.9, radius * 0.9, radius * 0.8, 16]} />
          <meshStandardMaterial color={opponentColor} />
        </mesh>
      )}
    </group>
  );
}

function CameraLookAtNet() {
  const { camera } = useThree();
  useFrame(() => {
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export function LandingAerialScene({ shots }: { shots: Shot3D[] }) {
  return (
    <Canvas
      camera={{ position: [2.8, 1.76, 0], fov: 50 }}
      shadows
      gl={{ antialias: true }}
    >
      <CameraLookAtNet />
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={20}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />
      <group position={[0, 0, 0]}>
        <TableSurface />
        <TableBorder />
        <Net />
        <TableGrid />
        {shots.map((shot, i) => (
          <AppearingBall key={shot.id} shot={shot} index={i} />
        ))}
      </group>
    </Canvas>
  );
}
