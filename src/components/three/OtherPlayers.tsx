import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { RemotePlayer } from '../../types/wish';
import { getTerrainHeight } from '../../utils/terrain';

const SingleRemoteBokssul = ({
  player,
  hideLabels,
}: {
  player: RemotePlayer;
  hideLabels: boolean;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const currentPos = useRef({ x: player.x, z: player.z });
  const currentRot = useRef(player.rot);
  const hopTimer = useRef(Math.random() * 10);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // 다른 유저의 위치로 부드럽게 미끄러지듯 보간 이동 (끊김 방지)
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
      ? Math.abs(Math.sin(hopTimer.current)) * 0.32
      : 0;

    groupRef.current.position.set(
      currentPos.current.x,
      groundY + 0.45 + hopOffset,
      currentPos.current.z
    );
    groupRef.current.rotation.y = currentRot.current;
  });

  return (
    <group
      ref={groupRef}
      position={[player.x, getTerrainHeight(player.x, player.z) + 0.45, player.z]}
    >
      {!hideLabels && (
        <Html
          position={[0, 1.25, 0]}
          center
          distanceFactor={14}
          zIndexRange={[10, 0]}
        >
          <div className="flex flex-col items-center pointer-events-none">
            {player.emote && (
              <div className="mb-1 px-2.5 py-0.5 bg-amber-400 text-stone-950 rounded-full text-xs font-extrabold shadow-md animate-bounce whitespace-nowrap">
                {player.emote}
              </div>
            )}
            <div className="px-2 py-0.5 bg-stone-900/80 backdrop-blur-sm rounded-full text-[10px] font-bold text-white shadow border border-white/25 whitespace-nowrap flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: player.color }}
              />
              <span>{player.nickname}</span>
            </div>
          </div>
        </Html>
      )}

      {/* 다른 유저의 복쓸덩이 몸통 */}
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

      {/* 사과머리 & 유저가 선택한 색상의 머리끈 */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshToonMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.14, 0.05, 8, 20]} />
        <meshToonMaterial color={player.color} />
      </mesh>

      {/* 눈과 코 */}
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
  );
};

export const OtherPlayers = ({
  players,
  hideLabels = false,
}: {
  players: Record<string, RemotePlayer>;
  hideLabels?: boolean;
}) => {
  return (
    <group>
      {Object.values(players).map((p) => (
        <SingleRemoteBokssul key={p.id} player={p} hideLabels={hideLabels} />
      ))}
    </group>
  );
};