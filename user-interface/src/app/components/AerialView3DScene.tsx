"use client";

import { useRef } from "react";
import type { Mesh } from "three";
import { Canvas } from "@react-three/fiber";
import { Line, OrbitControls } from "@react-three/drei";
import type { Shot3D } from "../data/mock";
import { shots3D } from "../data/mock";

const TABLE_WIDTH = 1.525;
const TABLE_LENGTH = 2.74;

/** Convert meter coords (0,0 = left-near) to Three.js (center origin, Y-up) */
function toThreeCoords(x: number, y: number) {
  return {
    x: x - TABLE_WIDTH / 2,
    z: y - TABLE_LENGTH / 2,
  };
}

function TableGrid() {
  const gridSize = 0.2;
  const lines: React.ReactNode[] = [];

  for (let i = 0; i <= TABLE_WIDTH / gridSize; i++) {
    const x = i * gridSize - TABLE_WIDTH / 2;
    lines.push(
      <Line
        key={`v-${i}`}
        points={[[x, 0.01, -TABLE_LENGTH / 2], [x, 0.01, TABLE_LENGTH / 2]]}
        color="#78716c"
        lineWidth={0.5}
      />
    );
  }
  for (let i = 0; i <= TABLE_LENGTH / gridSize; i++) {
    const z = i * gridSize - TABLE_LENGTH / 2;
    lines.push(
      <Line
        key={`h-${i}`}
        points={[[-TABLE_WIDTH / 2, 0.01, z], [TABLE_WIDTH / 2, 0.01, z]]}
        color="#78716c"
        lineWidth={0.5}
      />
    );
  }

  return <group>{lines}</group>;
}

function ShotMarker({
  shot,
  onClick,
}: {
  shot: Shot3D;
  onClick: () => void;
}) {
  const meshRef = useRef<Mesh>(null);
  const { x, z } = toThreeCoords(shot.x, shot.y);
  const isYou = shot.player === "you";
  const color = shot.won ? "#10b981" : "#ef4444";
  const opponentColor = shot.won ? "#047857" : "#b91c1c";
  const radius = 0.04;

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <group position={[x, radius, z]}>
      {isYou ? (
        <mesh
          ref={meshRef}
          onClick={handleClick}
          onPointerOver={(e) => (e.stopPropagation(), (document.body.style.cursor = "pointer"))}
          onPointerOut={() => (document.body.style.cursor = "auto")}
          castShadow
          receiveShadow
        >
          <sphereGeometry args={[radius, 16, 16]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ) : (
        <mesh
          ref={meshRef}
          onClick={handleClick}
          onPointerOver={(e) => (e.stopPropagation(), (document.body.style.cursor = "pointer"))}
          onPointerOut={() => (document.body.style.cursor = "auto")}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[radius * 1.6, radius * 1.6, radius * 1.6]} />
          <meshStandardMaterial color={opponentColor} />
        </mesh>
      )}
    </group>
  );
}

function TableSurface() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[TABLE_WIDTH, TABLE_LENGTH]} />
      <meshStandardMaterial color="#fef3c7" />
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
        <meshStandardMaterial color="#fb923c" />
      </mesh>
      <mesh position={[h + w / 2, 0.01, 0]} receiveShadow>
        <boxGeometry args={[w, 0.02, TABLE_LENGTH + w * 2]} />
        <meshStandardMaterial color="#fb923c" />
      </mesh>
      <mesh position={[0, 0.01, -v - w / 2]} receiveShadow>
        <boxGeometry args={[TABLE_WIDTH + w * 2, 0.02, w]} />
        <meshStandardMaterial color="#fb923c" />
      </mesh>
      <mesh position={[0, 0.01, v + w / 2]} receiveShadow>
        <boxGeometry args={[TABLE_WIDTH + w * 2, 0.02, w]} />
        <meshStandardMaterial color="#fb923c" />
      </mesh>
    </group>
  );
}

function Net() {
  return (
    <mesh position={[0, 0.05, 0]} receiveShadow>
      <boxGeometry args={[TABLE_WIDTH + 0.04, 0.02, 0.02]} />
      <meshStandardMaterial color="#78716c" />
    </mesh>
  );
}

export function AerialView3DScene({
  shots = shots3D,
  onShotSelect,
}: {
  shots?: Shot3D[];
  onShotSelect: (shot: Shot3D) => void;
}) {
  return (
    <Canvas
      camera={{ position: [0, 3, 3], fov: 50 }}
      shadows
      gl={{ antialias: true }}
    >
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
        {shots.map((shot) => (
          <ShotMarker
            key={shot.id}
            shot={shot}
            onClick={() => onShotSelect(shot)}
          />
        ))}
      </group>
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={1}
        maxDistance={12}
      />
    </Canvas>
  );
}
