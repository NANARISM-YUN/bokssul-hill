import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
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

// 1. 머리 위 보상화(寶相華) 4단계 성장 장식 (사과머리 꼭대기 위치에 맞춤 조정)
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
    <group position={[0, 0.86, 0]}>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.025, 0.035, 0.16, 8]} />
        <meshToonMaterial color="#4ade80" />
      </mesh>

      <mesh position={[-0.08, 0.13, 0]} rotation={[0, 0, 0.55]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshToonMaterial color="#22c55e" />
      </mesh>
      <mesh position={[0.08, 0.13, 0]} rotation={[0, 0, -0.55]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshToonMaterial color="#22c55e" />
      </mesh>

      {stage === 2 && (
        <mesh position={[0, 0.22, 0]}>
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshStandardMaterial
            color={palette.main}
            emissive={palette.main}
            emissiveIntensity={0.45}
          />
        </mesh>
      )}

      {stage === 3 && (
        <group>
          <group ref={flowerRef} position={[0, 0.24, 0]}>
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const angle = (i * Math.PI * 2) / 6;
              return (
                <mesh
                  key={i}
                  position={[Math.cos(angle) * 0.14, 0, Math.sin(angle) * 0.14]}
                  rotation={[0.35, -angle, 0]}
                >
                  <sphereGeometry args={[0.09, 8, 8]} />
                  <meshStandardMaterial
                    color={palette.main}
                    emissive={palette.main}
                    emissiveIntensity={0.35}
                  />
                </mesh>
              );
            })}
            <mesh position={[0, 0.07, 0]}>
              <sphereGeometry args={[0.07, 10, 10]} />
              <meshStandardMaterial
                color={palette.core}
                emissive={palette.core}
                emissiveIntensity={1.5}
              />
            </mesh>
          </group>

          <mesh ref={haloRef} position={[0, -0.42, -0.3]}>
            <ringGeometry args={[0.52, 0.62, 24]} />
            <meshBasicMaterial
              color="#fde047"
              side={THREE.DoubleSide}
              transparent
              opacity={0.75}
            />
          </mesh>
        </group>
      )}
    </group>
  );
};

// 2. 홍보영상 시그니처 디자인: 노란 매듭 끈이 감긴 풍성한 싸리빗자루 & 앞발 파지 모션
export const SsariBroomMesh = ({ isSweeping }: { isSweeping: boolean }) => {
  const broomRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!broomRef.current) return;
    if (isSweeping) {
      // 홍보영상처럼 몸 앞에서 두 앞발로 빗자루를 잡고 좌우로 쓱싹이는 모션
      const swing = Math.sin(state.clock.elapsedTime * 20) * 0.65;
      broomRef.current.position.set(swing * 0.38, -0.02, 0.56);
      broomRef.current.rotation.set(0.35, swing * 0.4, swing * 0.85 - 0.3);
    } else {
      // 평소에는 옆구리/등 뒤에 귀엽게 비스듬히 메고 다님
      broomRef.current.position.set(0.26, 0.1, -0.38);
      broomRef.current.rotation.set(0.2, 0, -0.75);
    }
  });

  return (
    <group ref={broomRef}>
      {/* 황토빛 대나무 자루 */}
      <mesh position={[0, 0.24, 0]}>
        <cylinderGeometry args={[0.042, 0.048, 0.58, 8]} />
        <meshToonMaterial color="#b48a4e" />
      </mesh>
      {/* 자루 상단 노란 띠 장식 */}
      <mesh position={[0, 0.44, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.045, 0.012, 6, 14]} />
        <meshBasicMaterial color="#fde047" />
      </mesh>

      {/* 빗자루 목 부분 짙은 갈색 묶음통 */}
      <mesh position={[0, -0.02, 0]}>
        <cylinderGeometry args={[0.065, 0.085, 0.14, 10]} />
        <meshToonMaterial color="#78552b" />
      </mesh>

      {/* 홍보영상 속 시그니처: 노란색 매듭 끈 3줄 */}
      {[-0.08, -0.13, -0.18].map((ry, idx) => (
        <mesh
          key={idx}
          position={[0, ry, 0]}
          rotation={[Math.PI / 2 + (idx - 1) * 0.12, 0, 0]}
        >
          <torusGeometry args={[0.09 + idx * 0.025, 0.014, 6, 16]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
      ))}

      {/* 갈래갈래 퍼진 풍성한 싸리나무 솔 */}
      <group position={[0, -0.26, 0]}>
        <mesh>
          <coneGeometry args={[0.24, 0.42, 9]} />
          <meshToonMaterial color="#a67c37" />
        </mesh>
        <mesh position={[-0.08, -0.04, 0.04]} rotation={[0, 0, -0.25]}>
          <coneGeometry args={[0.14, 0.38, 7]} />
          <meshToonMaterial color="#b88b42" />
        </mesh>
        <mesh position={[0.08, -0.04, -0.03]} rotation={[0, 0, 0.25]}>
          <coneGeometry args={[0.14, 0.38, 7]} />
          <meshToonMaterial color="#936c2d" />
        </mesh>
      </group>

      {/* 빗자루질할 때 자루를 감싸 쥐는 복쓸덩이의 하얀 두 앞발 */}
      {isSweeping && (
        <>
          <mesh position={[-0.06, 0.18, 0.05]}>
            <sphereGeometry args={[0.075, 8, 8]} />
            <meshToonMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.06, 0.08, 0.05]}>
            <sphereGeometry args={[0.075, 8, 8]} />
            <meshToonMaterial color="#ffffff" />
          </mesh>
        </>
      )}
    </group>
  );
};