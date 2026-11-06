import React, { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Sparkles, Float } from '@react-three/drei';
import * as THREE from 'three';
import { Crown } from 'lucide-react';
import type { Wish } from '../../types/wish';

export const WishPouchObject = ({
  wish,
  onSelect,
  hideLabels = false,
  showAllTreeLabels = false,
}: {
  wish: Wish;
  onSelect: (w: Wish) => void;
  hideLabels?: boolean;
  showAllTreeLabels?: boolean;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const orbsRef = useRef<THREE.Group>(null);
  const progressRef = useRef(0);
  const [hovered, setHovered] = useState(false);

  const isQiFull = wish.blessings.length >= wish.targetBlessings;

  // [1-A 규칙] 평소에는 '내 소원'이나 '기운충만'만 배지를 띄우고, '나무 시점'이거나 호버 시 전체 표시
  const shouldShowHangingBadge =
    !hideLabels && (wish.isMine || isQiFull || showAllTreeLabels || hovered);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    if (wish.status === 'hanging') {
      groupRef.current.position.set(...wish.branchPos);
      groupRef.current.rotation.z =
        Math.sin(state.clock.elapsedTime * 2.2 + Number(wish.id)) * 0.1;

      const baseScale = isQiFull ? 1.18 : 1.0;
      const targetScale = hovered ? baseScale * 1.2 : baseScale;
      groupRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        10 * delta
      );

      if (orbsRef.current) {
        orbsRef.current.rotation.y += delta * (isQiFull ? 3.5 : 1.8);
      }
    } else if (wish.status === 'ascending') {
      progressRef.current = Math.min(1, progressRef.current + delta * 0.35);
      const t = progressRef.current;
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      const start = new THREE.Vector3(...wish.branchPos);
      const end = new THREE.Vector3(...wish.starPos);
      const currentPos = new THREE.Vector3().lerpVectors(start, end, ease);
      currentPos.x += Math.sin(t * Math.PI * 4) * (1 - t) * 2.0;
      currentPos.z += Math.cos(t * Math.PI * 4) * (1 - t) * 2.0;

      groupRef.current.position.copy(currentPos);
      groupRef.current.rotation.y += delta * 8;
    } else if (wish.status === 'star') {
      groupRef.current.position.set(...wish.starPos);
      groupRef.current.rotation.y += delta * 1.5;
    }
  });

  const isStarOrAscending =
    wish.status === 'star' || wish.status === 'ascending';

  return (
    <group
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(wish);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {!isStarOrAscending ? (
        <Float speed={2.5} rotationIntensity={0.15} floatIntensity={0.35}>
          <group>
            {wish.isMine && (
              <mesh position={[0, 1.2, 0]}>
                <cylinderGeometry args={[0.08, 0.45, 3.2, 16]} />
                <meshBasicMaterial
                  color="#fde047"
                  transparent
                  opacity={0.32}
                  depthWrite={false}
                />
              </mesh>
            )}

            {isQiFull && (
              <>
                <mesh>
                  <sphereGeometry args={[0.62, 16, 16]} />
                  <meshBasicMaterial
                    color="#facc15"
                    transparent
                    opacity={0.35}
                  />
                </mesh>
                <Sparkles
                  count={25}
                  scale={1.8}
                  size={4}
                  speed={1.2}
                  color="#fef08a"
                />
                <pointLight color="#fbbf24" intensity={2} distance={5} />
              </>
            )}

            <mesh position={[0, 0.48, 0]}>
              <cylinderGeometry args={[0.018, 0.018, 0.55]} />
              <meshBasicMaterial color="#fde047" />
            </mesh>

            <mesh castShadow>
              <sphereGeometry args={[0.38, 20, 20]} />
              <meshToonMaterial color={wish.color} />
            </mesh>
            <mesh position={[0, 0.26, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.21, 0.05, 10, 20]} />
              <meshToonMaterial color="#facc15" />
            </mesh>
            <mesh position={[0, 0.35, 0]}>
              <cylinderGeometry args={[0.27, 0.16, 0.16, 12]} />
              <meshToonMaterial color={wish.color} />
            </mesh>

            <group ref={orbsRef}>
              {wish.blessings.map((b, idx) => {
                const angle =
                  (idx * Math.PI * 2) / Math.max(1, wish.blessings.length);
                return (
                  <mesh
                    key={b.id}
                    position={[
                      Math.cos(angle) * 0.6,
                      0.05,
                      Math.sin(angle) * 0.6,
                    ]}
                  >
                    <sphereGeometry args={[0.09, 12, 12]} />
                    <meshStandardMaterial
                      color="#fef08a"
                      emissive="#f59e0b"
                      emissiveIntensity={2}
                    />
                  </mesh>
                );
              })}
            </group>

            {shouldShowHangingBadge && (
              <Html
                position={[0, -0.62, 0]}
                center
                distanceFactor={14}
                zIndexRange={[10, 0]}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(wish);
                  }}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shadow-md whitespace-nowrap flex items-center gap-1 transition transform ${
                    isQiFull
                      ? 'bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-stone-950 ring-1 ring-white'
                      : wish.isMine
                      ? 'bg-amber-950/95 text-amber-200 ring-1 ring-amber-400'
                      : 'bg-stone-900/85 text-amber-100 border border-amber-400/40'
                  }`}
                >
                  {wish.isMine && (
                    <Crown className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                  )}
                  <span>
                    {isQiFull ? `✨ ${wish.nickname}` : wish.nickname}
                  </span>
                  <span
                    className={
                      isQiFull ? 'text-rose-900 font-black' : 'text-amber-300'
                    }
                  >
                    ({wish.blessings.length}/{wish.targetBlessings})
                  </span>
                </button>
              </Html>
            )}
          </group>
        </Float>
      ) : (
        <group>
          <mesh>
            <octahedronGeometry args={[wish.isMine ? 0.85 : 0.65, 0]} />
            <meshStandardMaterial
              color="#fffbeb"
              emissive={wish.isMine ? '#fbbf24' : '#f59e0b'}
              emissiveIntensity={wish.isMine ? 4.2 : 3.0}
              toneMapped={false}
            />
          </mesh>
          {wish.isMine && (
            <mesh rotation={[Math.PI / 3, 0, 0]}>
              <torusGeometry args={[1.25, 0.04, 12, 32]} />
              <meshBasicMaterial color="#fde047" />
            </mesh>
          )}
          <pointLight color="#fbbf24" intensity={3.5} distance={12} />
          <Sparkles
            count={wish.isMine ? 35 : 20}
            scale={3.2}
            size={5}
            speed={0.8}
            color="#fef08a"
          />
          {!hideLabels && (
            <Html
              position={[0, -1.0, 0]}
              center
              distanceFactor={18}
              zIndexRange={[10, 0]}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(wish);
                }}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold shadow-xl whitespace-nowrap transition flex items-center gap-1 ${
                  wish.isMine
                    ? 'bg-amber-400 text-stone-950 ring-2 ring-white'
                    : 'bg-yellow-400/25 hover:bg-yellow-400/50 backdrop-blur-md border border-yellow-300/60 text-yellow-100'
                }`}
              >
                {wish.isMine ? '👑' : '⭐'} {wish.nickname}별
              </button>
            </Html>
          )}
        </group>
      )}
    </group>
  );
};