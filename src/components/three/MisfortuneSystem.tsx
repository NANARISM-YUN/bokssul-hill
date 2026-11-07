import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { MisfortuneSpirit } from '../../types/wish';
import { getTerrainHeight } from '../../utils/terrain';

const SingleSpiritMesh = ({
  spirit,
  playerPosRef,
  hideLabels,
  onSweepSpirit,
}: {
  spirit: MisfortuneSpirit;
  playerPosRef: React.MutableRefObject<{ x: number; z: number }>;
  hideLabels: boolean;
  onSweepSpirit: (id: string) => void;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Group>(null);
  const puddleRef = useRef<THREE.Group>(null);
  const seed = useRef(Math.random() * 10);
  const [isNearPlayer, setIsNearPlayer] = useState(false);
  const nearCheckTimer = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current || !coreRef.current) return;
    const t = state.clock.elapsedTime + seed.current;

    nearCheckTimer.current += delta;
    if (nearCheckTimer.current > 0.25) {
      nearCheckTimer.current = 0;
      const dist = Math.hypot(
        spirit.x - playerPosRef.current.x,
        spirit.z - playerPosRef.current.z
      );
      const shouldShow = Boolean(spirit.isBoss) || dist < 6.8;
      if (shouldShow !== isNearPlayer) {
        setIsNearPlayer(shouldShow);
      }
    }

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
        groundY + floatHeight + Math.sin(t * 3.5) * 0.1,
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
    coreRef.current.rotation.y += delta * (spirit.isBoss ? 1.5 : 2.2);

    if (puddleRef.current) {
      puddleRef.current.rotation.y = -t * 0.8;
    }
  });

  const hpPercent = Math.max(0, Math.min(100, (spirit.hp / spirit.maxHp) * 100));
  const isBeingPurified = spirit.hp < spirit.maxHp;

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
      {/* 홍보영상 1·2번째 캡처 반영: 바닥에 깔리는 마젠타/보랏빛 물방울 독기 장판 */}
      <group
        ref={puddleRef}
        position={[0, spirit.isBoss ? -0.82 : -0.38, 0]}
        scale={spirit.isBoss ? 2.1 : 1.0}
      >
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.72, 16]} />
          <meshBasicMaterial
            color="#d946ef"
            transparent
            opacity={0.45}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* 분홍 물방울 도트 패턴 */}
        {[0, 1, 2, 3].map((i) => {
          const a = (i * Math.PI) / 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 0.42, 0.01, Math.sin(a) * 0.42]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <circleGeometry args={[0.13, 10]} />
              <meshBasicMaterial color="#f0abfc" side={THREE.DoubleSide} />
            </mesh>
          );
        })}
      </group>

      <group ref={coreRef}>
        {/* 액운 구름 몸통 */}
        <mesh>
          <dodecahedronGeometry args={[0.45, 1]} />
          <meshStandardMaterial
            color={spirit.isBoss ? '#2e1065' : '#701a75'}
            emissive={spirit.isBoss ? '#991b1b' : '#a21caf'}
            emissiveIntensity={spirit.isBoss ? 1.1 : 0.7}
            roughness={0.75}
          />
        </mesh>
        <mesh position={[-0.24, 0.1, 0.12]}>
          <dodecahedronGeometry args={[0.28, 0]} />
          <meshToonMaterial color={spirit.isBoss ? '#4c1d95' : '#86198f'} />
        </mesh>
        <mesh position={[0.24, -0.08, -0.1]}>
          <dodecahedronGeometry args={[0.26, 0]} />
          <meshToonMaterial color={spirit.isBoss ? '#4c1d95' : '#86198f'} />
        </mesh>

        {/* 홍보영상 2번째 캡처 반영: 빗자루에 쓸려 정화될 때 피어오르는 민트/초록빛 정화 구름 */}
        {isBeingPurified && (
          <>
            <mesh position={[-0.32, 0.25, 0.2]}>
              <sphereGeometry args={[0.18, 8, 8]} />
              <meshBasicMaterial color="#86efac" transparent opacity={0.75} />
            </mesh>
            <mesh position={[0.3, -0.15, 0.22]}>
              <sphereGeometry args={[0.14, 8, 8]} />
              <meshBasicMaterial color="#6ee7b7" transparent opacity={0.75} />
            </mesh>
          </>
        )}

        {spirit.isBoss && (
          <>
            <mesh position={[-0.22, 0.45, 0]} rotation={[0, 0, 0.4]}>
              <coneGeometry args={[0.1, 0.35, 6]} />
              <meshBasicMaterial color="#ef4444" />
            </mesh>
            <mesh position={[0.22, 0.45, 0]} rotation={[0, 0, -0.4]}>
              <coneGeometry args={[0.1, 0.35, 6]} />
              <meshBasicMaterial color="#ef4444" />
            </mesh>
          </>
        )}

        <mesh position={[-0.14, 0.08, 0.38]}>
          <sphereGeometry args={[0.065, 8, 8]} />
          <meshBasicMaterial color={spirit.isBoss ? '#ff1744' : '#fef08a'} />
        </mesh>
        <mesh position={[0.14, 0.08, 0.38]}>
          <sphereGeometry args={[0.065, 8, 8]} />
          <meshBasicMaterial color={spirit.isBoss ? '#ff1744' : '#fef08a'} />
        </mesh>
      </group>

      {!hideLabels && isNearPlayer && (
        <Html
          position={[0, spirit.isBoss ? 1.45 : 0.82, 0]}
          center
          distanceFactor={15}
          zIndexRange={[10, 0]}
        >
          <div className="px-2 py-1 bg-stone-950/90 border border-fuchsia-400/50 rounded-xl shadow-md pointer-events-none flex flex-col items-center gap-0.5 min-w-[68px]">
            <div className="text-[9px] font-extrabold text-amber-200 whitespace-nowrap">
              {spirit.isBoss ? '⚡ 대액운' : '👾 액운'} {spirit.hp}/{spirit.maxHp}
            </div>
            <div className="w-14 h-1.5 bg-stone-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-200 ${
                  spirit.isBoss ? 'bg-red-500' : 'bg-fuchsia-400'
                }`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

export const MisfortuneSystem = ({
  spirits,
  playerPosRef,
  hideLabels,
  onSweepSpirit,
}: {
  spirits: MisfortuneSpirit[];
  playerPosRef: React.MutableRefObject<{ x: number; z: number }>;
  hideLabels: boolean;
  onSweepSpirit: (id: string) => void;
}) => {
  return (
    <group>
      {spirits.map((sp) => (
        <SingleSpiritMesh
          key={sp.id}
          spirit={sp}
          playerPosRef={playerPosRef}
          hideLabels={hideLabels}
          onSweepSpirit={onSweepSpirit}
        />
      ))}
    </group>
  );
};