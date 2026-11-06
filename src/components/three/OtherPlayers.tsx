import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import type { RemotePlayer } from '../../types/wish';
import { getTerrainHeight } from '../../utils/terrain';

const SingleRemoteBokssul = ({
  player,
  hideLabels,
  isFollowed,
  onSelectFollow,
}: {
  player: RemotePlayer;
  hideLabels: boolean;
  isFollowed: boolean;
  onSelectFollow: (id: string) => void;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const currentPos = useRef({ x: player.x, z: player.z });
  const currentRot = useRef(player.rot);
  const hopTimer = useRef(Math.random() * 10);

  useFrame((state, delta) => {
    if (!groupRef.current || !bodyRef.current) return;

    currentPos.current.x = THREE.MathUtils.lerp(
      currentPos.current.x,
      player.x,
      10 * delta
    );
    currentPos.current.z = THREE.MathUtils.lerp(
      currentPos.current.z,
      player.z,
      10 * delta
    );
    currentRot.current = THREE.MathUtils.lerp(
      currentRot.current,
      player.rot,
      10 * delta
    );

    const dist = Math.hypot(
      player.x - currentPos.current.x,
      player.z - currentPos.current.z
    );
    const isActuallyMoving = player.isMoving || dist > 0.04;

    if (isActuallyMoving) {
      hopTimer.current += delta * 15;
    } else {
      hopTimer.current = 0;
    }

    const groundY = getTerrainHeight(
      currentPos.current.x,
      currentPos.current.z
    );
    const hopOffset = isActuallyMoving
      ? Math.abs(Math.sin(hopTimer.current)) * 0.34
      : 0;

    // 바디랭귀지 액션 모션 처리
    let actionY = 0;
    bodyRef.current.rotation.set(0, 0, 0);
    bodyRef.current.scale.set(1, 1, 1);

    if (player.action === 'jump') {
      actionY = Math.abs(Math.sin(state.clock.elapsedTime * 12)) * 0.9;
      bodyRef.current.rotation.y = state.clock.elapsedTime * 10;
    } else if (player.action === 'roll') {
      bodyRef.current.rotation.x = state.clock.elapsedTime * 12;
    } else if (player.action === 'bow') {
      bodyRef.current.rotation.x =
        Math.abs(Math.sin(state.clock.elapsedTime * 6)) * 0.65;
    } else if (player.action === 'sit') {
      bodyRef.current.scale.set(1.25, 0.68, 1.25);
      actionY = -0.14;
    } else if (isActuallyMoving) {
      // 말랑 텐션 (Squash & Stretch)
      const squash = Math.sin(hopTimer.current * 2) * 0.12;
      bodyRef.current.scale.set(1 - squash * 0.5, 1 + squash, 1 - squash * 0.5);
    }

    groupRef.current.position.set(
      currentPos.current.x,
      groundY + 0.45 + hopOffset + actionY,
      currentPos.current.z
    );
    groupRef.current.rotation.y = currentRot.current;
  });

  return (
    <group
      ref={groupRef}
      position={[
        player.x,
        getTerrainHeight(player.x, player.z) + 0.45,
        player.z,
      ]}
      onClick={(e) => {
        e.stopPropagation();
        onSelectFollow(player.id);
      }}
    >
      {!hideLabels && (
        <Html
          position={[0, 1.3, 0]}
          center
          distanceFactor={14}
          zIndexRange={[10, 0]}
        >
          <div className="flex flex-col items-center">
            {player.emote && (
              <div className="mb-1 px-2.5 py-0.5 bg-amber-400 text-stone-950 rounded-full text-xs font-extrabold shadow-md animate-bounce whitespace-nowrap pointer-events-none">
                {player.emote}
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectFollow(player.id);
              }}
              className={`px-2.5 py-0.5 backdrop-blur-sm rounded-full text-[10px] font-bold shadow border whitespace-nowrap flex items-center gap-1 transition ${
                isFollowed
                  ? 'bg-amber-400 text-stone-950 border-white ring-2 ring-amber-300'
                  : 'bg-stone-900/80 text-white border-white/25 hover:bg-stone-800'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: player.color }}
              />
              <span>
                {isFollowed ? `🚂 ${player.nickname} 따라가는 중` : player.nickname}
              </span>
            </button>
          </div>
        </Html>
      )}

      {player.action === 'jump' && (
        <Sparkles count={15} scale={1.8} size={4} color="#fde047" />
      )}

      <group ref={bodyRef}>
        <mesh castShadow>
          <sphereGeometry args={[0.46, 24, 24]} />
          <meshToonMaterial color="#ffffff" />
        </mesh>
        <mesh position={[-0.26, -0.05, 0.1]} castShadow>
          <sphereGeometry args={[0.32, 16, 16]} />
          <meshToonMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0.26, -0.05, 0.1]} castShadow>
          <sphereGeometry args={[0.32, 16, 16]} />
          <meshToonMaterial color="#ffffff" />
        </mesh>

        <mesh position={[0, 0.5, 0]} castShadow>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshToonMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.14, 0.05, 8, 20]} />
          <meshToonMaterial color={player.color} />
        </mesh>

        <mesh position={[0, 0.06, 0.44]}>
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshBasicMaterial color="#1c1917" />
        </mesh>
        <mesh position={[-0.15, 0.17, 0.4]}>
          <sphereGeometry args={[0.048, 12, 12]} />
          <meshBasicMaterial color="#1c1917" />
        </mesh>
        <mesh position={[0.15, 0.17, 0.4]}>
          <sphereGeometry args={[0.048, 12, 12]} />
          <meshBasicMaterial color="#1c1917" />
        </mesh>
      </group>
    </group>
  );
};

export const OtherPlayers = ({
  players,
  hideLabels = false,
  followingId,
  onSelectFollow,
}: {
  players: Record<string, RemotePlayer>;
  hideLabels?: boolean;
  followingId: string | null;
  onSelectFollow: (id: string) => void;
}) => {
  return (
    <group>
      {Object.values(players).map((p) => (
        <SingleRemoteBokssul
          key={p.id}
          player={p}
          hideLabels={hideLabels}
          isFollowed={followingId === p.id}
          onSelectFollow={onSelectFollow}
        />
      ))}
    </group>
  );
};