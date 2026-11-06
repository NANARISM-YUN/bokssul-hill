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

// 3. 60fps 직접 제어 방식의 개별 구슬 메쉬 (React 리렌더링 없이 부드럽게 이동)
const SmoothRollingOrbMesh = ({
  orbIndex,
  orbsRef,
  altarX,
  altarZ,
}: {
  orbIndex: number;
  orbsRef: React.MutableRefObject<RollingOrb[]>;
  altarX: number;
  altarZ: number;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const renderPos = useRef({ x: 0, z: 0, initialized: false });
  const sinkProgress = useRef(0);

  useFrame((_, delta) => {
    const orb = orbsRef.current[orbIndex];
    if (!orb || !groupRef.current || !meshRef.current) return;

    const dt = Math.min(delta, 0.05);

    // 색상 동기화
    if (materialRef.current) {
      materialRef.current.color.set(orb.color);
      materialRef.current.emissive.set(orb.color);
    }

    if (!renderPos.current.initialized) {
      renderPos.current.x = orb.x;
      renderPos.current.z = orb.z;
      renderPos.current.initialized = true;
    }

    if (orb.collected) {
      // 바구니 홀 안으로 빨려 들어가며 작아지는 연출
      sinkProgress.current = Math.min(1, sinkProgress.current + dt * 3.0);
      const p = sinkProgress.current;
      const altarY = getTerrainHeight(altarX, altarZ);

      const curX = THREE.MathUtils.lerp(renderPos.current.x, altarX, p * 0.88);
      const curZ = THREE.MathUtils.lerp(renderPos.current.z, altarZ, p * 0.88);
      const curY = altarY + 0.65 - p * 1.15;
      const scale = Math.max(0.001, 1 - p * 0.98);

      groupRef.current.position.set(curX, curY, curZ);
      groupRef.current.scale.set(scale, scale, scale);
      groupRef.current.visible = p < 0.99;
    } else {
      sinkProgress.current = 0;
      groupRef.current.visible = true;
      groupRef.current.scale.set(1, 1, 1);

      // 리스폰 등 큰 위치 변화 시 즉시 이동, 평소에는 60fps 고주파 보간으로 스무스하게 추적
      const jumpDist = Math.hypot(
        orb.x - renderPos.current.x,
        orb.z - renderPos.current.z
      );
      if (jumpDist > 4.0) {
        renderPos.current.x = orb.x;
        renderPos.current.z = orb.z;
      } else {
        const prevX = renderPos.current.x;
        const prevZ = renderPos.current.z;
        renderPos.current.x = THREE.MathUtils.lerp(prevX, orb.x, Math.min(1, 22 * dt));
        renderPos.current.z = THREE.MathUtils.lerp(prevZ, orb.z, Math.min(1, 22 * dt));

        // 실제 이동량(dx, dz)에 비례해 공이 땅을 구르듯 자연스럽게 회전
        const moveDx = renderPos.current.x - prevX;
        const moveDz = renderPos.current.z - prevZ;
        meshRef.current.rotation.x += moveDz * 2.1;
        meshRef.current.rotation.z -= moveDx * 2.1;
      }

      const y = getTerrainHeight(renderPos.current.x, renderPos.current.z) + 0.52;
      groupRef.current.position.set(renderPos.current.x, y, renderPos.current.z);
    }
  });

  const initialOrb = orbsRef.current[orbIndex];
  const initColor = initialOrb?.color || '#ffd740';

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} castShadow>
        <icosahedronGeometry args={[0.52, 2]} />
        <meshStandardMaterial
          ref={materialRef}
          color={initColor}
          emissive={initColor}
          emissiveIntensity={0.6}
          roughness={0.15}
          metalness={0.1}
        />
      </mesh>
      <Sparkles count={7} scale={1.2} size={3} color="#ffffff" />
    </group>
  );
};

// 4. 입체 복바구니 & 60fps 구슬 물리 루프 통합 컴포넌트
export const WishAltarAndOrbs = ({
  orbsRef,
  playerPosRef,
  playerMoveVecRef,
  collectedCount,
  hideLabels,
  meteorActive,
  onOrbEvent,
}: {
  orbsRef: React.MutableRefObject<RollingOrb[]>;
  playerPosRef: React.MutableRefObject<{ x: number; z: number }>;
  playerMoveVecRef: React.MutableRefObject<{ x: number; z: number; isMoving: boolean }>;
  collectedCount: number;
  hideLabels: boolean;
  meteorActive: boolean;
  onOrbEvent: (orbs: RollingOrb[], justCollected: boolean) => void;
}) => {
  const altarX = 0;
  const altarZ = 6.0;
  const altarY = getTerrainHeight(altarX, altarZ);
  const lastNetworkSync = useRef(0);

  // 매 프레임(60fps)마다 끊김 없이 돌아가는 구슬 전용 물리 엔진
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.04);
    const orbs = orbsRef.current;
    const pPos = playerPosRef.current;
    const pMove = playerMoveVecRef.current;

    let anyOrbMoving = false;
    let newlyCollected = false;

    for (let i = 0; i < orbs.length; i++) {
      const orb = orbs[i];
      if (orb.collected) continue;

      // ① 내 복쓸덩이와 충돌 시 탄성 킥 부여
      const dx = orb.x - pPos.x;
      const dz = orb.z - pPos.z;
      const dist = Math.hypot(dx, dz);

      if (dist < 1.08 && dist > 0.0001) {
        const nx = dx / dist;
        const nz = dz / dist;
        // 겹침 해소
        orb.x += nx * (1.08 - dist);
        orb.z += nz * (1.08 - dist);

        // 캐릭터의 이동 방향과 부딪힌 각도를 합산해 부드럽고 묵직한 속도 전달
        const kickPower = pMove.isMoving ? 9.5 : 4.8;
        orb.vx = nx * kickPower + pMove.x * 3.2;
        orb.vz = nz * kickPower + pMove.z * 3.2;
        anyOrbMoving = true;
      }

      // ② 구슬끼리 부딪혔을 때 당구공 탄성 충돌
      for (let j = i + 1; j < orbs.length; j++) {
        const other = orbs[j];
        if (other.collected) continue;
        const odx = other.x - orb.x;
        const odz = other.z - orb.z;
        const odist = Math.hypot(odx, odz);
        if (odist < 1.05 && odist > 0.0001) {
          const onx = odx / odist;
          const onz = odz / odist;
          const overlap = (1.05 - odist) * 0.5;
          orb.x -= onx * overlap;
          orb.z -= onz * overlap;
          other.x += onx * overlap;
          other.z += onz * overlap;

          const relVx = orb.vx - other.vx;
          const relVz = orb.vz - other.vz;
          const impact = Math.max(3.8, Math.hypot(relVx, relVz) * 0.65);
          orb.vx = -onx * impact;
          orb.vz = -onz * impact;
          other.vx = onx * impact;
          other.vz = onz * impact;
          anyOrbMoving = true;
        }
      }

      // ③ 매 프레임 연속 이동 + 언덕 경사면 자연 굴러내림 + 잔디 마찰 감속
      const speed = Math.hypot(orb.vx, orb.vz);
      if (speed > 0.04) {
        anyOrbMoving = true;

        // 언덕 경사도 계산 (오르막이면 살짝 느려지고 내리막이면 자연스럽게 굴러감)
        const hCenter = getTerrainHeight(orb.x, orb.z);
        const hX = getTerrainHeight(orb.x + 0.2, orb.z);
        const hZ = getTerrainHeight(orb.x, orb.z + 0.2);
        const slopeX = (hX - hCenter) / 0.2;
        const slopeZ = (hZ - hCenter) / 0.2;

        orb.vx -= slopeX * 3.2 * dt;
        orb.vz -= slopeZ * 3.2 * dt;

        orb.x += orb.vx * dt;
        orb.z += orb.vz * dt;

        // 부드러운 감속 마찰계수 (끊기지 않고 길게 데구르르 굴러감)
        const damping = Math.exp(-1.55 * dt);
        orb.vx *= damping;
        orb.vz *= damping;

        // 맵 경계선 및 당산나무 기둥 바운스
        const distOrigin = Math.hypot(orb.x, orb.z);
        if (distOrigin > 23.0) {
          const bx = orb.x / distOrigin;
          const bz = orb.z / distOrigin;
          orb.x = bx * 22.9;
          orb.z = bz * 22.9;
          orb.vx *= -0.7;
          orb.vz *= -0.7;
        } else if (distOrigin < 2.25) {
          const bx = orb.x / (distOrigin || 1);
          const bz = orb.z / (distOrigin || 1);
          orb.x = bx * 2.3;
          orb.z = bz * 2.3;
          orb.vx = bx * 5.5;
          orb.vz = bz * 5.5;
        }
      } else {
        orb.vx = 0;
        orb.vz = 0;
      }

      // ④ 입체 복바구니(0, 6.0) 골인 판정 및 홀 흡입 효과
      const distToBasket = Math.hypot(orb.x - altarX, orb.z - altarZ);
      if (distToBasket < 2.35 && distToBasket > 1.32) {
        orb.vx += ((altarX - orb.x) / distToBasket) * 14 * dt;
        orb.vz += ((altarZ - orb.z) / distToBasket) * 14 * dt;
        anyOrbMoving = true;
      } else if (distToBasket <= 1.32) {
        orb.collected = true;
        orb.vx = 0;
        orb.vz = 0;
        newlyCollected = true;
        anyOrbMoving = true;
      }
    }

    // 네트워크 브로드캐스트는 0.12초 간격으로만 가볍게 전송 (내 화면은 60fps 유지)
    const now = state.clock.elapsedTime;
    if (newlyCollected || (anyOrbMoving && now - lastNetworkSync.current > 0.12)) {
      lastNetworkSync.current = now;
      onOrbEvent(orbs, newlyCollected);
    }
  });

  return (
    <group>
      {/* 언덕 경사에 파묻히지 않는 입체 복바구니 (포켓 홀) */}
      <group position={[altarX, altarY, altarZ]}>
        <mesh position={[0, -0.1, 0]} receiveShadow>
          <cylinderGeometry args={[1.65, 1.85, 0.55, 28]} />
          <meshToonMaterial color="#5d4037" />
        </mesh>

        <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.55, 1.25, 0.55, 28, 1, true]} />
          <meshToonMaterial color="#8d6e63" side={THREE.DoubleSide} />
        </mesh>

        <mesh position={[0, 0.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.52, 0.12, 12, 32]} />
          <meshToonMaterial color={meteorActive ? '#fef08a' : '#facc15'} />
        </mesh>

        <mesh position={[0, 0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.38, 28]} />
          <meshBasicMaterial color={meteorActive ? '#fef08a' : '#1c1917'} />
        </mesh>

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

      {/* 3개의 오색 구슬 (60fps 직접 제어) */}
      {[0, 1, 2].map((idx) => (
        <SmoothRollingOrbMesh
          key={idx}
          orbIndex={idx}
          orbsRef={orbsRef}
          altarX={altarX}
          altarZ={altarZ}
        />
      ))}
    </group>
  );
};