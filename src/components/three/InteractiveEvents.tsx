import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import type { RollingOrb } from '../../types/wish';
import { getTerrainHeight } from '../../utils/terrain';

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

// --- 홍보영상 3번째 캡처 재현: 황금빛 네온 '복' 주머니 프로시저럴 텍스처 생성기 (단 1회 생성 후 공유) ---
let cachedBokPouchTexture: THREE.CanvasTexture | null = null;
const getNeonBokPouchTexture = (): THREE.CanvasTexture => {
  if (cachedBokPouchTexture) return cachedBokPouchTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.clearRect(0, 0, 256, 256);

    // 은은한 황금빛 후광 배경
    const grad = ctx.createRadialGradient(128, 138, 15, 128, 138, 108);
    grad.addColorStop(0, 'rgba(254, 240, 138, 0.42)');
    grad.addColorStop(0.6, 'rgba(250, 204, 21, 0.16)');
    grad.addColorStop(1, 'rgba(250, 204, 21, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    // 네온 황금 선 스타일 설정
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 16;

    // 1. 복주머니 둥근 몸통 외곽선
    ctx.beginPath();
    ctx.arc(128, 156, 64, -0.22 * Math.PI, 1.22 * Math.PI, false);
    ctx.stroke();

    // 2. 복주머니 위쪽 주름진 프릴 입구
    ctx.beginPath();
    ctx.moveTo(82, 112);
    ctx.quadraticCurveTo(62, 62, 96, 52);
    ctx.quadraticCurveTo(114, 66, 128, 48);
    ctx.quadraticCurveTo(144, 66, 162, 52);
    ctx.quadraticCurveTo(194, 62, 174, 112);
    ctx.stroke();

    // 3. 주름선 디테일
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(112, 74);
    ctx.lineTo(118, 102);
    ctx.moveTo(144, 74);
    ctx.lineTo(138, 102);
    ctx.stroke();

    // 4. 나비 리본 매듭과 양옆 끈
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(102, 106, 22, 11, -0.25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(154, 106, 22, 11, 0.25, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(96, 112);
    ctx.quadraticCurveTo(68, 125, 58, 142);
    ctx.moveTo(156, 112);
    ctx.quadraticCurveTo(176, 135, 172, 162);
    ctx.stroke();

    // 5. 정중앙 네온 한글 '복' 글자
    ctx.fillStyle = '#fef08a';
    ctx.font = '900 58px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('복', 128, 164);
  }

  cachedBokPouchTexture = new THREE.CanvasTexture(canvas);
  return cachedBokPouchTexture;
};

// 하늘에서 둥실둥실 내려오는 개별 황금 '복' 주머니
const SingleFallingBokPouch = ({
  seed,
  texture,
}: {
  seed: number;
  texture: THREE.CanvasTexture;
}) => {
  const spriteRef = useRef<THREE.Sprite>(null);
  const fallSpeed = 4.2 + (seed % 5) * 0.9;
  const offset = seed * 1.3;

  useFrame((state) => {
    if (!spriteRef.current) return;
    const t = (state.clock.elapsedTime * 0.55 + offset) % 4.5;

    const startX = -18 + ((seed * 7) % 36);
    const startZ = -14 + ((seed * 5) % 28);
    const swayX = Math.sin(state.clock.elapsedTime * 2 + seed) * 1.4;
    const curY = 25 - t * fallSpeed;

    spriteRef.current.position.set(startX + swayX, curY, startZ);
    spriteRef.current.material.rotation =
      Math.sin(state.clock.elapsedTime * 2.5 + seed) * 0.28;

    const scale = 2.4 + (seed % 3) * 0.55;
    spriteRef.current.scale.set(scale, scale, 1);
  });

  return (
    <sprite ref={spriteRef}>
      <spriteMaterial
        map={texture}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </sprite>
  );
};

// 하늘에서 쏟아지는 황금빛 네온 '복' 주머니 축제 이펙트
export const MeteorShowerEffect = ({ active }: { active: boolean }) => {
  const seeds = useMemo(() => Array.from({ length: 16 }, (_, i) => i + 1), []);
  const texture = useMemo(() => getNeonBokPouchTexture(), []);

  if (!active) return null;

  return (
    <group>
      {seeds.map((s) => (
        <SingleFallingBokPouch key={s} seed={s} texture={texture} />
      ))}
      <Sparkles
        count={60}
        scale={[36, 22, 36]}
        position={[0, 14, 0]}
        size={5}
        speed={1.2}
        color="#fde047"
      />
    </group>
  );
};

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

      const jumpDist = Math.hypot(
        orb.x - renderPos.current.x,
        orb.z - renderPos.current.z
      );
      if (jumpDist > 5.0) {
        renderPos.current.x = orb.x;
        renderPos.current.z = orb.z;
      } else {
        const prevX = renderPos.current.x;
        const prevZ = renderPos.current.z;
        renderPos.current.x = THREE.MathUtils.lerp(
          prevX,
          orb.x,
          Math.min(1, 18 * dt)
        );
        renderPos.current.z = THREE.MathUtils.lerp(
          prevZ,
          orb.z,
          Math.min(1, 18 * dt)
        );

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
    </group>
  );
};

export const WishAltarAndOrbs = ({
  myId,
  orbsRef,
  playerPosRef,
  playerMoveVecRef,
  collectedCount,
  hideLabels,
  meteorActive,
  onOrbEvent,
}: {
  myId: string;
  orbsRef: React.MutableRefObject<RollingOrb[]>;
  playerPosRef: React.MutableRefObject<{ x: number; z: number }>;
  playerMoveVecRef: React.MutableRefObject<{
    x: number;
    z: number;
    isMoving: boolean;
  }>;
  collectedCount: number;
  hideLabels: boolean;
  meteorActive: boolean;
  onOrbEvent: (orbs: RollingOrb[], justCollected: boolean) => void;
}) => {
  const altarX = 0;
  const altarZ = 6.0;
  const altarY = getTerrainHeight(altarX, altarZ);
  const lastNetworkSync = useRef(0);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.04);
    const orbs = orbsRef.current;
    const pPos = playerPosRef.current;
    const pMove = playerMoveVecRef.current;

    let myOrbsMoved = false;
    let newlyCollected = false;

    for (let i = 0; i < orbs.length; i++) {
      const orb = orbs[i];
      if (orb.collected) continue;

      const dx = orb.x - pPos.x;
      const dz = orb.z - pPos.z;
      const dist = Math.hypot(dx, dz);

      if (dist < 1.08 && dist > 0.0001) {
        const nx = dx / dist;
        const nz = dz / dist;
        orb.x += nx * (1.08 - dist);
        orb.z += nz * (1.08 - dist);

        const kickPower = pMove.isMoving ? 9.5 : 4.8;
        orb.vx = nx * kickPower + pMove.x * 3.2;
        orb.vz = nz * kickPower + pMove.z * 3.2;
        orb.ownerId = myId;
        orb.updatedAt = Date.now();
        myOrbsMoved = true;
      }

      const isOwnedByOther =
        orb.ownerId &&
        orb.ownerId !== myId &&
        Date.now() - (orb.updatedAt || 0) < 2000;

      if (isOwnedByOther) {
        orb.x += orb.vx * dt;
        orb.z += orb.vz * dt;
        orb.vx *= Math.exp(-1.55 * dt);
        orb.vz *= Math.exp(-1.55 * dt);
        continue;
      }

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
          other.ownerId = myId;
          other.updatedAt = Date.now();
          myOrbsMoved = true;
        }
      }

      const speed = Math.hypot(orb.vx, orb.vz);
      if (speed > 0.04) {
        if (orb.ownerId === myId) myOrbsMoved = true;

        const hCenter = getTerrainHeight(orb.x, orb.z);
        const hX = getTerrainHeight(orb.x + 0.2, orb.z);
        const hZ = getTerrainHeight(orb.x, orb.z + 0.2);
        const slopeX = (hX - hCenter) / 0.2;
        const slopeZ = (hZ - hCenter) / 0.2;

        orb.vx -= slopeX * 3.2 * dt;
        orb.vz -= slopeZ * 3.2 * dt;

        orb.x += orb.vx * dt;
        orb.z += orb.vz * dt;

        const damping = Math.exp(-1.55 * dt);
        orb.vx *= damping;
        orb.vz *= damping;

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

      if (orb.ownerId === myId) {
        const distToBasket = Math.hypot(orb.x - altarX, orb.z - altarZ);
        if (distToBasket < 2.35 && distToBasket > 1.32) {
          orb.vx += ((altarX - orb.x) / distToBasket) * 14 * dt;
          orb.vz += ((altarZ - orb.z) / distToBasket) * 14 * dt;
          myOrbsMoved = true;
        } else if (distToBasket <= 1.32) {
          orb.collected = true;
          orb.vx = 0;
          orb.vz = 0;
          newlyCollected = true;
          myOrbsMoved = true;
        }
      }
    }

    const now = state.clock.elapsedTime;
    if (newlyCollected || (myOrbsMoved && now - lastNetworkSync.current > 0.1)) {
      lastNetworkSync.current = now;
      onOrbEvent(orbs, newlyCollected);
    }
  });

  return (
    <group>
      {/* 지형과 절대 겹치지 않도록 지면 위로 높게 세운 입체 전통 붉은 복항아리 */}
      <group position={[altarX, altarY, altarZ]}>
        {/* 1. 넓은 돌기단 받침대 (언덕 경사를 완전히 덮음) */}
        <mesh position={[0, 0.12, 0]} receiveShadow>
          <cylinderGeometry args={[1.65, 1.85, 0.45, 24]} />
          <meshToonMaterial color="#78716c" />
        </mesh>

        {/* 2. 볼록한 붉은 복항아리 몸통 */}
        <mesh position={[0, 0.62, 0]}>
          <cylinderGeometry args={[1.38, 1.52, 0.65, 24]} />
          <meshToonMaterial color="#7f1d1d" />
        </mesh>

        {/* 3. 항아리 입구 황금 테두리 */}
        <mesh position={[0, 0.96, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.38, 0.12, 10, 28]} />
          <meshToonMaterial color={meteorActive ? '#fef08a' : '#facc15'} />
        </mesh>

        {/* 4. 땅보다 훨씬 위(y=0.95)에 위치해 절대 잔디와 겹치지 않는 항아리 안쪽 홀 */}
        <mesh position={[0, 0.95, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.32, 24]} />
          <meshBasicMaterial color={meteorActive ? '#fef08a' : '#1c1917'} />
        </mesh>

        {/* 수집 구슬 보석 3개 */}
        {[0, 1, 2].map((idx) => {
          const angle = (idx * Math.PI * 2) / 3 - Math.PI / 2;
          const isFilled = idx < collectedCount || meteorActive;
          return (
            <mesh
              key={idx}
              position={[Math.cos(angle) * 1.4, 1.1, Math.sin(angle) * 1.4]}
            >
              <sphereGeometry args={[0.2, 12, 12]} />
              <meshStandardMaterial
                color={isFilled ? '#fef08a' : '#44403c'}
                emissive={isFilled ? '#f59e0b' : '#000000'}
                emissiveIntensity={isFilled ? 2.5 : 0}
              />
            </mesh>
          );
        })}

        {!hideLabels && (
          <Html
            position={[0, 1.45, 0]}
            center
            distanceFactor={15}
            zIndexRange={[10, 0]}
          >
            <div className="px-2.5 py-0.5 bg-stone-900/90 border border-amber-400/60 rounded-full text-[10px] font-extrabold text-amber-200 whitespace-nowrap shadow-md pointer-events-none">
              {meteorActive
                ? '🧧 하늘에서 복주머니가 쏟아집니다!'
                : `🏺 복항아리 ${collectedCount} / 3`}
            </div>
          </Html>
        )}
      </group>

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