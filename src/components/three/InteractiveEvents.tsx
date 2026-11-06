import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import type { RollingOrb } from '../../types/wish';
import { getTerrainHeight } from '../../utils/terrain';

// 1. 바닥 터치 이동 물결 마커
export const ClickTargetMarker = ({
  target,
}: {
  target: { x: number; z: number } | null;
}) => {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ringRef.current || !target) return;
    const s = 0.75 + Math.sin(state.clock.elapsedTime * 8) * 0.2;
    ringRef.current.scale.set(s, s, 1);
  });

  if (!target) return null;
  const y = getTerrainHeight(target.x, target.z) + 0.12;

  return (
    <group position={[target.x, y, target.z]}>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.48, 24]} />
        <meshBasicMaterial
          color="#fde047"
          side={THREE.DoubleSide}
          transparent
          opacity={0.9}
        />
      </mesh>
    </group>
  );
};

// 2. 밤하늘 황금 유성우 (별똥별) 연출
const SingleMeteor = ({ seed }: { seed: number }) => {
  const ref = useRef<THREE.Group>(null);
  const speed = 16 + (seed % 7) * 2;
  const offset = seed * 1.7;

  useFrame((state) => {
    if (!ref.current) return;
    const t = (state.clock.elapsedTime * 0.75 + offset) % 2.4;
    const startX = -22 + (seed % 6) * 9;
    const startY = 27 + (seed % 4) * 3;
    const startZ = -18 + (seed % 5) * 6;

    ref.current.position.set(
      startX + t * speed,
      startY - t * (speed * 0.72),
      startZ + t * 4
    );
    ref.current.rotation.z = -Math.PI / 4;
  });

  return (
    <group ref={ref}>
      <mesh>
        <octahedronGeometry args={[0.42, 0]} />
        <meshBasicMaterial color="#fef08a" />
      </mesh>
      <mesh position={[-1.9, 1.9, 0]} rotation={[0, 0, Math.PI / 4]}>
        <cylinderGeometry args={[0.02, 0.28, 3.8, 8]} />
        <meshBasicMaterial color="#fde047" transparent opacity={0.65} />
      </mesh>
    </group>
  );
};

export const MeteorShowerEffect = ({ active }: { active: boolean }) => {
  const seeds = useMemo(() => Array.from({ length: 14 }, (_, i) => i + 1), []);
  if (!active) return null;

  return (
    <group>
      {seeds.map((s) => (
        <SingleMeteor key={s} seed={s} />
      ))}
      <Sparkles
        count={180}
        scale={[45, 25, 45]}
        position={[0, 16, 0]}
        size={6}
        speed={1.8}
        color="#fde047"
      />
    </group>
  );
};

// 개별 복구슬 (구르는 회전 모션 + 바구니에 쏙 빠지는 낙하 애니메이션)
const SingleRollingOrbMesh = ({
  orb,
  altarX,
  altarZ,
}: {
  orb: RollingOrb;
  altarX: number;
  altarZ: number;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const sinkProgress = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current || !meshRef.current) return;

    if (orb.collected) {
      // 바구니 중앙 구멍으로 빨려 들어가며 아래로 쏙 빠지는 연출
      sinkProgress.current = Math.min(1, sinkProgress.current + delta * 2.8);
      const p = sinkProgress.current;
      const altarY = getTerrainHeight(altarX, altarZ);

      const curX = THREE.MathUtils.lerp(orb.x, altarX, p * 0.85);
      const curZ = THREE.MathUtils.lerp(orb.z, altarZ, p * 0.85);
      const curY = altarY + 0.65 - p * 1.1;
      const scale = Math.max(0.01, 1 - p * 0.95);

      groupRef.current.position.set(curX, curY, curZ);
      groupRef.current.scale.set(scale, scale, scale);
    } else {
      sinkProgress.current = 0;
      const y = getTerrainHeight(orb.x, orb.z) + 0.52;
      groupRef.current.position.lerp(new THREE.Vector3(orb.x, y, orb.z), 18 * delta);
      groupRef.current.scale.set(1, 1, 1);

      // 이동 속도에 맞춰 실제로 데구르르 회전
      meshRef.current.rotation.x += orb.vz * delta * 2.2;
      meshRef.current.rotation.z -= orb.vx * delta * 2.2;
    }
  });

  if (orb.collected && sinkProgress.current >= 1) return null;

  return (
    <group
      ref={groupRef}
      position={[orb.x, getTerrainHeight(orb.x, orb.z) + 0.52, orb.z]}
    >
      <mesh ref={meshRef} castShadow>
        <icosahedronGeometry args={[0.52, 2]} />
        <meshStandardMaterial
          color={orb.color}
          emissive={orb.color}
          emissiveIntensity={0.65}
          roughness={0.15}
          metalness={0.1}
        />
      </mesh>
      <Sparkles count={8} scale={1.3} size={3} color="#ffffff" />
    </group>
  );
};

// 3. 입체 복바구니(포켓) & 오색 복구슬들
export const WishAltarAndOrbs = ({
  orbs,
  hideLabels,
  meteorActive,
}: {
  orbs: RollingOrb[];
  hideLabels: boolean;
  meteorActive: boolean;
}) => {
  const altarX = 0;
  const altarZ = 6.0;
  const altarY = getTerrainHeight(altarX, altarZ);
  const collectedCount = orbs.filter((o) => o.collected).length;

  return (
    <group>
      {/* 언덕 경사에 파묻히지 않는 입체 오목 복바구니 (포켓 홀) */}
      <group position={[altarX, altarY, altarZ]}>
        {/* 바닥 받침대 (언덕 경사 보정용 원통 베이스) */}
        <mesh position={[0, -0.1, 0]} receiveShadow>
          <cylinderGeometry args={[1.65, 1.85, 0.55, 28]} />
          <meshToonMaterial color="#5d4037" />
        </mesh>

        {/* 오목한 바구니 외벽 */}
        <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.55, 1.25, 0.55, 28, 1, true]} />
          <meshToonMaterial color="#8d6e63" side={THREE.DoubleSide} />
        </mesh>

        {/* 바구니 입구 황금 밧줄 테두리 */}
        <mesh position={[0, 0.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.52, 0.12, 12, 32]} />
          <meshToonMaterial color={meteorActive ? '#fef08a' : '#facc15'} />
        </mesh>

        {/* 구슬이 쏙 빠지는 바구니 안쪽 깊은 홀(구멍) */}
        <mesh position={[0, 0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.38, 28]} />
          <meshBasicMaterial color={meteorActive ? '#fef08a' : '#1c1917'} />
        </mesh>

        {/* 바구니 테두리에 박힌 수집 현황 보석 3개 */}
        {[0, 1, 2].map((idx) => {
          const angle = (idx * Math.PI * 2) / 3 - Math.PI / 2;
          const isFilled = idx < collectedCount || meteorActive;
          return (
            <mesh
              key={idx}
              position={[Math.cos(angle) * 1.52, 0.68, Math.sin(angle) * 1.52]}
            >
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshStandardMaterial
                color={isFilled ? '#fef08a' : '#44403c'}
                emissive={isFilled ? '#f59e0b' : '#000000'}
                emissiveIntensity={isFilled ? 2.8 : 0}
              />
            </mesh>
          );
        })}

        {meteorActive && (
          <Sparkles
            count={35}
            scale={3}
            position={[0, 1.2, 0]}
            size={5}
            color="#fde047"
          />
        )}

        {/* 심플하고 직관적인 미니 배지 */}
        {!hideLabels && (
          <Html
            position={[0, 1.05, 0]}
            center
            distanceFactor={15}
            zIndexRange={[10, 0]}
          >
            <div className="px-2.5 py-0.5 bg-stone-900/85 backdrop-blur-sm border border-amber-400/60 rounded-full text-[10px] font-extrabold text-amber-200 whitespace-nowrap shadow-md pointer-events-none">
              {meteorActive
                ? '🌠 별똥별 축제 중!'
                : `🧺 복바구니 ${collectedCount} / 3`}
            </div>
          </Html>
        )}
      </group>

      {/* 오색 복구슬 렌더링 (텍스트 라벨 제거로 시야 확보) */}
      {orbs.map((orb) => (
        <SingleRollingOrbMesh
          key={orb.id}
          orb={orb}
          altarX={altarX}
          altarZ={altarZ}
        />
      ))}
    </group>
  );
};