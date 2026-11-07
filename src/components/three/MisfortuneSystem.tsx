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
  const ringRef = useRef<THREE.Mesh>(null);
  const seed = useRef(Math.random() * 10);

  useFrame((state, delta) => {
    if (!groupRef.current || !coreRef.current) return;
    const t = state.clock.elapsedTime + seed.current;

    const wobbleRadius = spirit.isBoss ? 0.55 : 0.25;
    const wobbleX = Math.sin(t * (spirit.isBoss ? 1.4 : 2.2)) * wobbleRadius;
    const wobbleZ = Math.cos(t * (spirit.isBoss ? 1.2 : 1.8)) * wobbleRadius;
    const curX = spirit.x + wobbleX;
    const curZ = spirit.z + wobbleZ;
    const groundY = getTerrainHeight(curX, curZ);
    const floatHeight = spirit.isBoss ? 0.95 : 0.48;

    groupRef.current.position.lerp(
      new THREE.Vector3(
        curX,
        groundY + floatHeight + Math.sin(t * 3.5) * 0.14,
        curZ
      ),
      10 * delta
    );

    const hpRatio = 0.55 + (spirit.hp / spirit.maxHp) * 0.45;
    const targetScale = spirit.scale * hpRatio;
    coreRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      12 * delta
    );
    coreRef.current.rotation.y += delta * (spirit.isBoss ? 1.5 : 2.5);

    if (ringRef.current) {
      ringRef.current.rotation.z = -t * 2;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[
        spirit.x,
        getTerrainHeight(spirit.x, spirit.z) + (spirit.isBoss ? 0.95 : 0.48),
        spirit.z,
      ]}
      onClick={(e) => {
        e.stopPropagation();
        onSweepSpirit(spirit.id);
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = 'auto')}
    >
      <group ref={coreRef}>
        {/* 먹구름 몸통 (보스는 붉은 기운이 감도는 칠흑색) */}
        <mesh castShadow>
          <dodecahedronGeometry args={[0.45, 1]} />
          <meshStandardMaterial
            color={spirit.isBoss ? '#090514' : '#1e1b4b'}
            emissive={spirit.isBoss ? '#991b1b' : '#4c1d95'}
            emissiveIntensity={spirit.isBoss ? 1.2 : 0.8}
            roughness={0.75}
          />
        </mesh>
        <mesh position={[-0.24, 0.1, 0.12]}>
          <dodecahedronGeometry args={[0.3, 0]} />
          <meshToonMaterial color={spirit.isBoss ? '#3b0764' : '#311042'} />
        </mesh>
        <mesh position={[0.24, -0.08, -0.1]}>
          <dodecahedronGeometry args={[0.28, 0]} />
          <meshToonMaterial color={spirit.isBoss ? '#3b0764' : '#311042'} />
        </mesh>

        {/* 보스 전용: 머리 위 번개 뿔 2개와 바닥 다크 오라 링 */}
        {spirit.isBoss && (
          <>
            <mesh position={[-0.22, 0.45, 0]} rotation={[0, 0, 0.4]}>
              <coneGeometry args={[0.1, 0.35, 6]} />
              <meshStandardMaterial
                color="#ef4444"
                emissive="#dc2626"
                emissiveIntensity={1.5}
              />
            </mesh>
            <mesh position={[0.22, 0.45, 0]} rotation={[0, 0, -0.4]}>
              <coneGeometry args={[0.1, 0.35, 6]} />
              <meshStandardMaterial
                color="#ef4444"
                emissive="#dc2626"
                emissiveIntensity={1.5}
              />
            </mesh>
            <mesh
              ref={ringRef}
              position={[0, -0.35, 0]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <ringGeometry args={[0.55, 0.72, 16]} />
              <meshBasicMaterial
                color="#ef4444"
                side={THREE.DoubleSide}
                transparent
                opacity={0.7}
              />
            </mesh>
          </>
        )}

        {/* 눈동자 (보스는 강렬한 붉은 안광) */}
        <mesh position={[-0.14, 0.08, 0.38]}>
          <sphereGeometry args={[0.065, 8, 8]} />
          <meshBasicMaterial color={spirit.isBoss ? '#ff1744' : '#facc15'} />
        </mesh>
        <mesh position={[0.14, 0.08, 0.38]}>
          <sphereGeometry args={[0.065, 8, 8]} />
          <meshBasicMaterial color={spirit.isBoss ? '#ff1744' : '#facc15'} />
        </mesh>
      </group>

      <Sparkles
        count={spirit.isBoss ? 28 : 10}
        scale={spirit.isBoss ? 2.6 : 1.4}
        size={spirit.isBoss ? 5 : 3.5}
        color={spirit.isBoss ? '#ef4444' : '#a855f7'}
      />

      {!hideLabels && (
        <Html
          position={[0, spirit.isBoss ? 1.45 : 0.85, 0]}
          center
          distanceFactor={15}
          zIndexRange={[10, 0]}
        >
          <div
            className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold whitespace-nowrap shadow-md pointer-events-none flex items-center gap-1 border ${
              spirit.isBoss
                ? 'bg-red-950/95 border-red-400 text-amber-200 animate-bounce'
                : 'bg-purple-950/90 border-purple-400/60 text-purple-200'
            }`}
          >
            <span>{spirit.isBoss ? '⚡ 거대 대액운' : '👾 액운'}</span>
            <span className="text-amber-300 font-black">
              {spirit.isBoss
                ? `HP ${spirit.hp}/${spirit.maxHp} (🫘팥 특효!)`
                : '❤️'.repeat(spirit.hp)}
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