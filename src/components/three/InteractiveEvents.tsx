import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import type { RollingOrb } from '../../types/wish';
import { getTerrainHeight } from '../../utils/terrain';

// 1. 바닥 터치 이동 시 나타나는 물결 마커
export const ClickTargetMarker = ({
  target,
}: {
  target: { x: number; z: number } | null;
}) => {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ringRef.current || !target) return;
    const s = 0.8 + Math.sin(state.clock.elapsedTime * 8) * 0.25;
    ringRef.current.scale.set(s, s, 1);
  });

  if (!target) return null;
  const y = getTerrainHeight(target.x, target.z) + 0.08;

  return (
    <group position={[target.x, y, target.z]}>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.35, 0.55, 24]} />
        <meshBasicMaterial
          color="#fde047"
          side={THREE.DoubleSide}
          transparent
          opacity={0.9}
        />
      </mesh>
      <mesh position={[0, 0.25, 0]}>
        <coneGeometry args={[0.18, 0.35, 12]} />
        <meshBasicMaterial color="#facc15" />
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

// 3. 동산의 복구슬 모으기 제단 & 굴러다니는 복구슬
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
  const altarZ = 6.2;
  const altarY = getTerrainHeight(altarX, altarZ) + 0.05;
  const collectedCount = orbs.filter((o) => o.collected).length;

  return (
    <group>
      {/* 황금 기원 제단 (마법진) */}
      <group position={[altarX, altarY, altarZ]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.4, 1.75, 32]} />
          <meshBasicMaterial
            color={meteorActive ? '#fef08a' : '#f59e0b'}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
          <circleGeometry args={[1.6, 32]} />
          <meshBasicMaterial
            color="#fde047"
            transparent
            opacity={meteorActive ? 0.55 : 0.22}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* 제단에 모인 작은 구슬 표시 */}
        {[0, 1, 2].map((idx) => {
          const angle = (idx * Math.PI * 2) / 3;
          const isFilled = idx < collectedCount || meteorActive;
          return (
            <mesh
              key={idx}
              position={[Math.cos(angle) * 1.1, 0.25, Math.sin(angle) * 1.1]}
            >
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshStandardMaterial
                color={isFilled ? '#fef08a' : '#78716c'}
                emissive={isFilled ? '#f59e0b' : '#000000'}
                emissiveIntensity={isFilled ? 2.5 : 0}
              />
            </mesh>
          );
        })}

        {!hideLabels && (
          <Html
            position={[0, 0.9, 0]}
            center
            distanceFactor={15}
            zIndexRange={[10, 0]}
          >
            <div className="px-2.5 py-0.5 bg-amber-950/90 border border-amber-400/70 rounded-full text-[10px] font-extrabold text-amber-200 whitespace-nowrap shadow-md pointer-events-none">
              {meteorActive
                ? '🌠 밤하늘에 별똥별이 쏟아집니다!'
                : `🔮 별똥별 제단: 황금 복구슬을 밀어 넣어보세요 (${collectedCount}/3)`}
            </div>
          </Html>
        )}
      </group>

      {/* 동산에 흩어진 황금 복구슬들 */}
      {orbs.map((orb) => {
        if (orb.collected) return null;
        const y = getTerrainHeight(orb.x, orb.z) + 0.55;
        return (
          <group key={orb.id} position={[orb.x, y, orb.z]}>
            <mesh castShadow>
              <sphereGeometry args={[0.55, 24, 24]} />
              <meshStandardMaterial
                color="#fef08a"
                emissive="#f59e0b"
                emissiveIntensity={1.6}
                roughness={0.2}
              />
            </mesh>
            <Sparkles count={10} scale={1.4} size={3.5} color="#fffbeb" />
            {!hideLabels && (
              <Html
                position={[0, 0.85, 0]}
                center
                distanceFactor={15}
                zIndexRange={[10, 0]}
              >
                <div className="px-2 py-0.5 bg-amber-400/95 text-stone-950 rounded-full text-[9px] font-black whitespace-nowrap shadow pointer-events-none">
                  ✨ 복구슬 (밀어보기)
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
};