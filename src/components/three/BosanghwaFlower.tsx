import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import type { FlowerType } from '../../types/wish';
import { getGrowthStage } from '../../hooks/useGameProgress';

const FLOWER_COLORS: Record<
  FlowerType,
  { main: string; sub: string; core: string }
> = {
  white_lotus: { main: '#ffffff', sub: '#fef08a', core: '#f59e0b' },
  pink_lotus: { main: '#f48fb1', sub: '#fce4ec', core: '#fbbf24' },
  peony: { main: '#e91e63', sub: '#f8bbd0', core: '#fde047' },
  gold_plum: { main: '#facc15', sub: '#fef08a', core: '#ea580c' },
  blue_bosang: { main: '#38bdf8', sub: '#bae6fd', core: '#fef08a' },
};

// 1. 머리 위 보상화(寶相華) 4단계 성장 장식
export const BosanghwaHeadpiece = ({
  karma = 0,
  flowerType = 'pink_lotus',
}: {
  karma?: number;
  flowerType?: FlowerType;
}) => {
  const stage = getGrowthStage(karma);
  const haloRef = useRef<THREE.Mesh>(null);
  const flowerRef = useRef<THREE.Group>(null);
  const palette = FLOWER_COLORS[flowerType] || FLOWER_COLORS.pink_lotus;

  useFrame((state) => {
    if (haloRef.current) {
      haloRef.current.rotation.z = state.clock.elapsedTime * 1.5;
    }
    if (flowerRef.current && stage === 3) {
      flowerRef.current.rotation.y = state.clock.elapsedTime * 0.6;
    }
  });

  if (stage === 0) return null;

  return (
    <group position={[0, 0.72, 0]}>
      {/* 줄기 */}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.025, 0.035, 0.18, 8]} />
        <meshToonMaterial color="#4ade80" />
      </mesh>

      {/* [1단계 이상] 귀여운 두 잎 새싹 */}
      <mesh position={[-0.09, 0.14, 0]} rotation={[0, 0, 0.55]}>
        <sphereGeometry args={[0.075, 10, 10]} />
        <meshToonMaterial color="#22c55e" />
      </mesh>
      <mesh position={[0.09, 0.14, 0]} rotation={[0, 0, -0.55]}>
        <sphereGeometry args={[0.075, 10, 10]} />
        <meshToonMaterial color="#22c55e" />
      </mesh>

      {/* [2단계] 빛을 머금은 꽃봉오리 */}
      {stage === 2 && (
        <mesh position={[0, 0.24, 0]}>
          <sphereGeometry args={[0.13, 14, 14]} />
          <meshStandardMaterial
            color={palette.main}
            emissive={palette.main}
            emissiveIntensity={0.45}
          />
        </mesh>
      )}

      {/* [3단계] 만개한 불교 보상화(寶相華) + 황금 원형 후광(두광) */}
      {stage === 3 && (
        <group>
          <group ref={flowerRef} position={[0, 0.25, 0]}>
            {/* 바깥쪽 6개 큰 연꽃잎 */}
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const angle = (i * Math.PI * 2) / 6;
              return (
                <mesh
                  key={i}
                  position={[Math.cos(angle) * 0.15, 0, Math.sin(angle) * 0.15]}
                  rotation={[0.35, -angle, 0]}
                >
                  <sphereGeometry args={[0.1, 10, 10]} />
                  <meshStandardMaterial
                    color={palette.main}
                    emissive={palette.main}
                    emissiveIntensity={0.35}
                  />
                </mesh>
              );
            })}
            {/* 안쪽 6개 작은 겹꽃잎 */}
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const angle = (i * Math.PI * 2) / 6 + Math.PI / 6;
              return (
                <mesh
                  key={i}
                  position={[
                    Math.cos(angle) * 0.09,
                    0.05,
                    Math.sin(angle) * 0.09,
                  ]}
                >
                  <sphereGeometry args={[0.07, 10, 10]} />
                  <meshToonMaterial color={palette.sub} />
                </mesh>
              );
            })}
            {/* 황금 꽃술 중심 */}
            <mesh position={[0, 0.08, 0]}>
              <sphereGeometry args={[0.075, 12, 12]} />
              <meshStandardMaterial
                color={palette.core}
                emissive={palette.core}
                emissiveIntensity={1.5}
              />
            </mesh>
          </group>

          {/* 머리 뒤에서 은은하게 회전하는 황금 후광(頭光) */}
          <mesh ref={haloRef} position={[0, -0.35, -0.28]}>
            <ringGeometry args={[0.52, 0.62, 28]} />
            <meshBasicMaterial
              color="#fde047"
              side={THREE.DoubleSide}
              transparent
              opacity={0.75}
            />
          </mesh>
          <Sparkles count={12} scale={1.5} size={3.5} color="#fef08a" />
        </group>
      )}
    </group>
  );
};

// 2. 액운을 쓸어내는 전통 싸리빗자루 (평소엔 등 뒤에, 쓸 때는 앞에서 왕복)
export const SsariBroomMesh = ({ isSweeping }: { isSweeping: boolean }) => {
  const broomRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!broomRef.current) return;
    if (isSweeping) {
      // 앞에서 사악- 사악- 신나게 빗자루질하는 모션
      const swing = Math.sin(state.clock.elapsedTime * 22) * 0.75;
      broomRef.current.position.set(swing * 0.45, 0.05, 0.58);
      broomRef.current.rotation.set(0.4, swing * 0.5, swing);
    } else {
      // 평소에는 등 뒤에 귀엽게 대각선으로 메고 다님
      broomRef.current.position.set(0.18, 0.15, -0.44);
      broomRef.current.rotation.set(0.2, 0, -0.65);
    }
  });

  return (
    <group ref={broomRef}>
      {/* 대나무 자루 */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.035, 0.65, 8]} />
        <meshToonMaterial color="#a16207" />
      </mesh>
      {/* 붉은 액막이 매듭 끈 */}
      <mesh position={[0, -0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.075, 0.025, 8, 16]} />
        <meshToonMaterial color="#dc2626" />
      </mesh>
      {/* 풍성한 싸리나무 솔 */}
      <mesh position={[0, -0.22, 0]} castShadow>
        <coneGeometry args={[0.2, 0.42, 12]} />
        <meshToonMaterial color="#ca8a04" />
      </mesh>
    </group>
  );
};