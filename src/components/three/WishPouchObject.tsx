import React, { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
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
      const starScale = hovered ? 1.35 : 1.0;
      groupRef.current.scale.lerp(
        new THREE.Vector3(starScale, starScale, starScale),
        10 * delta
      );
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
        <group>
          {isQiFull && (
            <mesh>
              <sphereGeometry args={[0.58, 12, 12]} />
              <meshBasicMaterial
                color="#facc15"
                transparent
                opacity={0.32}
              />
            </mesh>
          )}

          <mesh position={[0, 0.48, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.55]} />
            <meshBasicMaterial color="#fde047" />
          </mesh>

          <mesh>
            <sphereGeometry args={[0.38, 14, 14]} />
            <meshToonMaterial color={wish.color} />
          </mesh>
          <mesh position={[0, 0.26, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.21, 0.05, 8, 16]} />
            <meshToonMaterial color="#facc15" />
          </mesh>
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.27, 0.16, 0.16, 10]} />
            <meshToonMaterial color={wish.color} />
          </mesh>

          <group ref={orbsRef}>
            {wish.blessings.slice(0, 6).map((b, idx, arr) => {
              const angle = (idx * Math.PI * 2) / Math.max(1, arr.length);
              return (
                <mesh
                  key={b.id}
                  position={[
                    Math.cos(angle) * 0.58,
                    0.05,
                    Math.sin(angle) * 0.58,
                  ]}
                >
                  <sphereGeometry args={[0.08, 8, 8]} />
                  <meshBasicMaterial color="#fef08a" />
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
                    ? 'bg-amber-400 text-stone-950 ring-1 ring-white'
                    : wish.isMine
                    ? 'bg-amber-950/95 text-amber-200 ring-1 ring-amber-400'
                    : 'bg-stone-900/85 text-amber-100 border border-amber-400/40'
                }`}
              >
                {wish.isMine && (
                  <Crown className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                )}
                <span>{wish.nickname}</span>
                <span className="text-amber-300">
                  ({wish.blessings.length}/{wish.targetBlessings})
                </span>
              </button>
            </Html>
          )}
        </group>
      ) : (
        <group>
          <mesh>
            <sphereGeometry args={[2.2, 8, 8]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>

          <mesh>
            <octahedronGeometry args={[wish.isMine ? 0.95 : 0.75, 0]} />
            <meshStandardMaterial
              color="#fffbeb"
              emissive={wish.isMine ? '#fbbf24' : '#f59e0b'}
              emissiveIntensity={3.5}
              toneMapped={false}
            />
          </mesh>
          {wish.isMine && (
            <mesh rotation={[Math.PI / 3, 0, 0]}>
              <torusGeometry args={[1.35, 0.05, 8, 24]} />
              <meshBasicMaterial color="#fde047" />
            </mesh>
          )}

          {!hideLabels && (
            <Html
              position={[0, -1.15, 0]}
              center
              distanceFactor={20}
              zIndexRange={[10, 0]}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(wish);
                }}
                className={`px-3 py-1 rounded-full text-xs font-extrabold shadow-xl whitespace-nowrap transition transform active:scale-95 flex items-center gap-1 ${
                  wish.isMine
                    ? 'bg-amber-400 text-stone-950 ring-2 ring-white'
                    : 'bg-indigo-950/85 hover:bg-indigo-900 border border-amber-300/80 text-amber-200'
                }`}
              >
                {wish.isMine ? '👑' : '⭐'} {wish.nickname}님의 별
              </button>
            </Html>
          )}
        </group>
      )}
    </group>
  );
};