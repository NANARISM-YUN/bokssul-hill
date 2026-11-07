import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import type { MisfortuneSpirit } from '../../types/wish';
import { getTerrainHeight } from '../../utils/terrain';

const SingleSpiritMesh = ({
  spirit,
  hideLabels,
  onSweepSpirit,
}: {
  spirit: MisfortuneSpirit;
  hideLabels: boolean;
  onSweepSpirit: (id: string) => void;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Group>(null);
  const seed = useRef(Math.random() * 10);

  useFrame((state, delta) => {
    if (!groupRef.current || !coreRef.current) return;
    const t = state.clock.elapsedTime + seed.current;

    // 제자리에서 스산하게 일렁이며 부유하는 움직임
    const wobbleX = Math.sin(t * 2.2) * 0.25;
    const wobbleZ = Math.cos(t * 1.8) * 0.25;
    const curX = spirit.x + wobbleX;
    const curZ = spirit.z + wobbleZ;
    const groundY = getTerrainHeight(curX, curZ);

    groupRef.current.position.lerp(
      new THREE.Vector3(curX, groundY + 0.48 + Math.sin(t * 4) * 0.1, curZ),
      10 * delta
    );

    // 체력(HP)이 깎일수록 크기가 쪼그라듦
    const hpRatio = 0.55 + (spirit.hp / spirit.maxHp) * 0.45;
    const targetScale = spirit.scale * hpRatio;
    coreRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      12 * delta
    );
    coreRef.current.rotation.y += delta * 2.5;
  });

  return (
    <group
      ref={groupRef}
      position={[
        spirit.x,
        getTerrainHeight(spirit.x, spirit.z) + 0.48,
        spirit.z,
      ]}
      onClick={(e) => {
        e.stopPropagation();
        onSweepSpirit(spirit.id);
      }}
    >
      <group ref={coreRef}>
        {/* 검은 액운 먹구름 몸통 */}
        <mesh castShadow>
          <dodecahedronGeometry args={[0.45, 1]} />
          <meshStandardMaterial
            color="#1e1b4b"
            emissive="#4c1d95"
            emissiveIntensity={0.8}
            roughness={0.8}
          />
        </mesh>
        <mesh position={[-0.22, 0.1, 0.12]}>
          <dodecahedronGeometry args={[0.28, 0]} />
          <meshToonMaterial color="#311042" />
        </mesh>
        <mesh position={[0.22, -0.08, -0.1]}>
          <dodecahedronGeometry args={[0.26, 0]} />
          <meshToonMaterial color="#311042" />
        </mesh>

        {/* 얄미운 노란 눈동자 */}
        <mesh position={[-0.14, 0.08, 0.38]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial color="#facc15" />
        </mesh>
        <mesh position={[0.14, 0.08, 0.38]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial color="#facc15" />
        </mesh>
      </group>

      <Sparkles count={10} scale={1.4} size={3.5} color="#a855f7" />

      {!hideLabels && (
        <Html
          position={[0, 0.85, 0]}
          center
          distanceFactor={15}
          zIndexRange={[10, 0]}
        >
          <div className="px-2 py-0.5 bg-purple-950/90 border border-purple-400/60 rounded-full text-[9px] font-extrabold text-purple-200 whitespace-nowrap shadow pointer-events-none flex items-center gap-1">
            <span>👾 액운</span>
            <span className="text-amber-300">
              {'❤️'.repeat(spirit.hp)}
            </span>
          </div>
        </Html>
      )}
    </group>
  );
};

export const MisfortuneSystem = ({
  spirits,
  hideLabels,
  onSweepSpirit,
}: {
  spirits: MisfortuneSpirit[];
  hideLabels: boolean;
  onSweepSpirit: (id: string) => void;
}) => {
  return (
    <group>
      {spirits.map((sp) => (
        <SingleSpiritMesh
          key={sp.id}
          spirit={sp}
          hideLabels={hideLabels}
          onSweepSpirit={onSweepSpirit}
        />
      ))}
    </group>
  );
};