"use client";

import { useRef } from "react";
import type { Mesh } from "three";
import { Canvas } from "@react-three/fiber";
import { Line, OrbitControls } from "@react-three/drei";
import type { Shot3D } from "../data/mock";
import { shots3D } from "../data/mock";

/** Ping pong table: 1.525m × 2.74m (ITTF standard) */
const TABLE_WIDTH = 1.525;
const TABLE_LENGTH = 2.74;

/** Zone colors: 1 lightest, 2 medium, 3 darkest — subtler pinks */
const ZONE_COLORS = ["#fef7f9", "#fcecf2", "#fadde8"];

/**
 * Fixed coordinate system (angles stable regardless of camera):
 * - X: out of screen, Y: paddle handle (toward hand), Z: vertical
 * Converts table coords (x,y in meters) to Three.js (center origin, Y-up).
 */
function toThreeCoords(x: number, y: number) {
  return {
    x: x - TABLE_WIDTH / 2,
    z: y - TABLE_LENGTH / 2,
  };
}

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
      />
    );
  }

  return <group>{lines}</group>;
}

function CoordinateAxes() {
  const axLen = 0.4;
  return (
    <group position={[-TABLE_WIDTH / 2 - 0.15, 0.02, TABLE_LENGTH / 2 + 0.1]}>
      <Line points={[[0, 0, 0], [axLen, 0, 0]]} color="#dc2626" lineWidth={2} />
      <Line points={[[0, 0, 0], [0, axLen, 0]]} color="#16a34a" lineWidth={2} />
      <Line points={[[0, 0, 0], [0, 0, -axLen]]} color="#2563eb" lineWidth={2} />
    </group>
  );
}

/** Green sphere = point won. Red cube = point lost. Only these two shapes are used. */
function ShotMarker({
  shot,
  onClick,
}: {
  shot: Shot3D;
  onClick: () => void;
}) {
  const meshRef = useRef<Mesh>(null);
  const { x, z } = toThreeCoords(shot.x, shot.y);
  const radius = 0.045;
  const color = shot.won ? "#22c55e" : "#ef4444";

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <group position={[x, radius, z]}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={(e) => (e.stopPropagation(), (document.body.style.cursor = "pointer"))}
        onPointerOut={() => (document.body.style.cursor = "auto")}
        castShadow
        receiveShadow
      >
        {shot.won ? (
          <>
            <sphereGeometry args={[radius, 20, 20]} />
            <meshStandardMaterial color={color} />
          </>
        ) : (
          <>
            <boxGeometry args={[radius * 2, radius * 2, radius * 2]} />
            <meshStandardMaterial color={color} />
          </>
        )}
      </mesh>
    </group>
  );
}

function TableSurface({ showZones = true }: { showZones?: boolean }) {
  if (!showZones) {
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[TABLE_WIDTH, TABLE_LENGTH]} />
        <meshStandardMaterial color="#fef3c7" />
      </mesh>
    );
  }
  const halfW = TABLE_WIDTH / 2;
  const thirdL = TABLE_LENGTH / 3;
  return (
    <group>
      {/* Left side: 3 zones 1,2,3 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-halfW / 2, 0.001, -thirdL]} receiveShadow>
        <planeGeometry args={[halfW, thirdL]} />
        <meshStandardMaterial color={ZONE_COLORS[0]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-halfW / 2, 0.001, 0]} receiveShadow>
        <planeGeometry args={[halfW, thirdL]} />
        <meshStandardMaterial color={ZONE_COLORS[1]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-halfW / 2, 0.001, thirdL]} receiveShadow>
        <planeGeometry args={[halfW, thirdL]} />
        <meshStandardMaterial color={ZONE_COLORS[2]} />
      </mesh>
      {/* Right side: 3 zones 3,2,1 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[halfW / 2, 0.001, -thirdL]} receiveShadow>
        <planeGeometry args={[halfW, thirdL]} />
        <meshStandardMaterial color={ZONE_COLORS[2]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[halfW / 2, 0.001, 0]} receiveShadow>
        <planeGeometry args={[halfW, thirdL]} />
        <meshStandardMaterial color={ZONE_COLORS[1]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[halfW / 2, 0.001, thirdL]} receiveShadow>
        <planeGeometry args={[halfW, thirdL]} />
        <meshStandardMaterial color={ZONE_COLORS[0]} />
      </mesh>
    </group>
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
  showZones = true,
}: {
  shots?: Shot3D[];
  onShotSelect: (shot: Shot3D) => void;
  showZones?: boolean;
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
        <TableSurface showZones={showZones} />
        <TableBorder />
        <Net />
        <TableGrid />
        <CoordinateAxes />
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
