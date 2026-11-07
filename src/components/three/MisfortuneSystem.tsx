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
  const ringRef = useRef<THREE.Mesh>(null);
  const seed = useRef(Math.random() * 10);
  const [isNearPlayer, setIsNearPlayer] = useState(false);
  const nearCheckTimer = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current || !coreRef.current) return;
    const t = state.clock.elapsedTime + seed.current;

    // 0.25초마다 플레이어와의 거리를 체크하여 가까울 때만 체력바 UI 표시 (렌더링 부하 절감 & 화면 정리)
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
        groundY + floatHeight + Math.sin(t * 3.5) * 0.12,
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

  const hpPercent = Math.max(0, Math.min(100, (spirit.hp / spirit.maxHp) * 100));

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
        <mesh>
          <dodecahedronGeometry args={[0.45, 1]} />
          <meshStandardMaterial
            color={spirit.isBoss ? '#090514' : '#1e1b4b'}
            emissive={spirit.isBoss ? '#991b1b' : '#4c1d95'}
            emissiveIntensity={spirit.isBoss ? 1.2 : 0.8}
            roughness={0.75}
          />
        </mesh>
        <mesh position={[-0.24, 0.1, 0.12]}>
          <dodecahedronGeometry args={[0.28, 0]} />
          <meshToonMaterial color={spirit.isBoss ? '#3b0764' : '#311042'} />
        </mesh>
        <mesh position={[0.24, -0.08, -0.1]}>
          <dodecahedronGeometry args={[0.26, 0]} />
          <meshToonMaterial color={spirit.isBoss ? '#3b0764' : '#311042'} />
        </mesh>

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

        <mesh position={[-0.14, 0.08, 0.38]}>
          <sphereGeometry args={[0.065, 8, 8]} />
          <meshBasicMaterial color={spirit.isBoss ? '#ff1744' : '#facc15'} />
        </mesh>
        <mesh position={[0.14, 0.08, 0.38]}>
          <sphereGeometry args={[0.065, 8, 8]} />
          <meshBasicMaterial color={spirit.isBoss ? '#ff1744' : '#facc15'} />
        </mesh>
      </group>

      {/* 가까이 다가갔을 때만 표시되는 슬림 프로그레스 체력바 */}
      {!hideLabels && isNearPlayer && (
        <Html
          position={[0, spirit.isBoss ? 1.45 : 0.82, 0]}
          center
          distanceFactor={15}
          zIndexRange={[10, 0]}
        >
          <div className="px-2 py-1 bg-stone-950/90 border border-purple-400/50 rounded-xl shadow-md pointer-events-none flex flex-col items-center gap-0.5 min-w-[68px]">
            <div className="text-[9px] font-extrabold text-amber-200 whitespace-nowrap">
              {spirit.isBoss ? '⚡ 대액운' : '👾 액운'} {spirit.hp}/{spirit.maxHp}
            </div>
            <div className="w-14 h-1.5 bg-stone-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-200 ${
                  spirit.isBoss ? 'bg-red-500' : 'bg-purple-400'
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