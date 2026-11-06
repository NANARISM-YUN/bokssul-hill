import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Sparkles } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import type {
  CameraMode,
  PlayerAction,
  RemotePlayer,
  RollingOrb,
} from '../../types/wish';
import { getTerrainHeight } from '../../utils/terrain';

export const BokssulPlayerAndCamera = ({
  keys,
  joystickVec,
  clickTarget,
  clearClickTarget,
  followingPlayer,
  stopFollowing,
  remotePlayers,
  orbsRef,
  onOrbPushed,
  onHighFive,
  controlsRef,
  cameraMode,
  focusedTarget,
  onNearTreeChange,
  hideLabels = false,
  myNickname = '복쓸덩이',
  myColor = '#d84315',
  myAction = 'idle',
  myEmote = null,
  onPositionBroadcast,
}: {
  keys: React.MutableRefObject<{ [key: string]: boolean }>;
  joystickVec: React.MutableRefObject<{ x: number; y: number }>;
  clickTarget: { x: number; z: number } | null;
  clearClickTarget: () => void;
  followingPlayer: RemotePlayer | null;
  stopFollowing: () => void;
  remotePlayers: Record<string, RemotePlayer>;
  orbsRef: React.MutableRefObject<RollingOrb[]>;
  onOrbPushed: (orbs: RollingOrb[], justCollected: boolean) => void;
  onHighFive: (friendName: string) => void;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  cameraMode: CameraMode;
  focusedTarget: [number, number, number] | null;
  onNearTreeChange: (isNear: boolean) => void;
  hideLabels?: boolean;
  myNickname?: string;
  myColor?: string;
  myAction?: PlayerAction;
  myEmote?: string | null;
  onPositionBroadcast?: (state: {
    x: number;
    z: number;
    rot: number;
    isMoving: boolean;
  }) => void;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const initialPos = useRef({
    x: (Math.random() - 0.5) * 4,
    z: 8.2 + Math.random() * 2,
  });
  const posRef = useRef({ x: initialPos.current.x, z: initialPos.current.z });
  const rotRef = useRef(Math.PI);
  const hopTimer = useRef(0);
  const nearRef = useRef(false);
  const lastBroadcastTime = useRef(0);
  const lastOrbSyncTime = useRef(0);
  const wasMovingRef = useRef(false);
  const lastHighFiveTime = useRef(0);
  const [highFiveSpark, setHighFiveSpark] = useState(false);

  const cameraTransitionTimer = useRef(0);
  useEffect(() => {
    cameraTransitionTimer.current = 1.25;
  }, [cameraMode, focusedTarget]);

  useFrame((state, delta) => {
    if (!groupRef.current || !bodyRef.current) return;
    const dt = Math.min(delta, 0.05);

    const speed = 5.8;
    let inputX = joystickVec.current.x;
    let inputZ = joystickVec.current.y;

    if (keys.current['ArrowUp'] || keys.current['KeyW']) inputZ -= 1;
    if (keys.current['ArrowDown'] || keys.current['KeyS']) inputZ += 1;
    if (keys.current['ArrowLeft'] || keys.current['KeyA']) inputX -= 1;
    if (keys.current['ArrowRight'] || keys.current['KeyD']) inputX += 1;

    const hasManualInput = Math.hypot(inputX, inputZ) > 0.05;

    if (hasManualInput) {
      if (clickTarget) clearClickTarget();
      if (followingPlayer) stopFollowing();
    }

    let moveVec = new THREE.Vector3();
    let isMoving = false;
    let moveLen = 1;

    if (hasManualInput) {
      isMoving = true;
      moveLen = Math.min(1, Math.hypot(inputX, inputZ));
      const normX = inputX / (Math.hypot(inputX, inputZ) || 1);
      const normZ = inputZ / (Math.hypot(inputX, inputZ) || 1);

      const camForward = new THREE.Vector3();
      state.camera.getWorldDirection(camForward);
      camForward.y = 0;
      camForward.normalize();
      const camRight = new THREE.Vector3(-camForward.z, 0, camForward.x);

      moveVec
        .addScaledVector(camRight, normX)
        .addScaledVector(camForward, -normZ)
        .normalize();
    } else if (followingPlayer) {
      const dx = followingPlayer.x - posRef.current.x;
      const dz = followingPlayer.z - posRef.current.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 1.35) {
        isMoving = true;
        moveVec.set(dx / dist, 0, dz / dist);
      }
    } else if (clickTarget) {
      const dx = clickTarget.x - posRef.current.x;
      const dz = clickTarget.z - posRef.current.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.25) {
        isMoving = true;
        moveVec.set(dx / dist, 0, dz / dist);
      } else {
        clearClickTarget();
      }
    }

    if (isMoving) {
      posRef.current.x += moveVec.x * speed * moveLen * dt;
      posRef.current.z += moveVec.z * speed * moveLen * dt;

      const distFromOrigin = Math.hypot(posRef.current.x, posRef.current.z);
      if (distFromOrigin > 25) {
        posRef.current.x = (posRef.current.x / distFromOrigin) * 25;
        posRef.current.z = (posRef.current.z / distFromOrigin) * 25;
      }
      if (distFromOrigin < 2.2) {
        posRef.current.x = (posRef.current.x / distFromOrigin) * 2.2;
        posRef.current.z = (posRef.current.z / distFromOrigin) * 2.2;
      }

      const targetRot = Math.atan2(moveVec.x, moveVec.z);
      rotRef.current = THREE.MathUtils.lerp(
        rotRef.current,
        targetRot,
        12 * dt
      );
      hopTimer.current += dt * 15;
    } else {
      hopTimer.current = 0;
    }

    const now = state.clock.elapsedTime;
    if (now - lastHighFiveTime.current > 4.0) {
      for (const rp of Object.values(remotePlayers)) {
        const d = Math.hypot(rp.x - posRef.current.x, rp.z - posRef.current.z);
        if (d < 1.05) {
          lastHighFiveTime.current = now;
          setHighFiveSpark(true);
          onHighFive(rp.nickname);
          setTimeout(() => setHighFiveSpark(false), 1800);
          break;
        }
      }
    }

    // --- [탄성 공 물리 엔진] 부딪히면 통! 튕겨서 데구르르 굴러가고 바구니로 쏙 빠짐 ---
    const altarX = 0;
    const altarZ = 6.0;
    let anyOrbActive = false;
    let newlyCollected = false;

    const orbs = orbsRef.current;
    for (let i = 0; i < orbs.length; i++) {
      const orb = orbs[i];
      if (orb.collected) continue;

      // 1. 내 복쓸덩이가 공을 쳤을 때 강한 탄성 임펄스(속도) 부여
      const dx = orb.x - posRef.current.x;
      const dz = orb.z - posRef.current.z;
      const dist = Math.hypot(dx, dz);

      if (dist < 1.08 && dist > 0.001) {
        const nx = dx / dist;
        const nz = dz / dist;
        const overlap = 1.08 - dist;
        orb.x += nx * overlap;
        orb.z += nz * overlap;

        const kickPower = isMoving ? 10.5 : 5.5;
        orb.vx = nx * kickPower + moveVec.x * 2.5;
        orb.vz = nz * kickPower + moveVec.z * 2.5;
        anyOrbActive = true;
      }

      // 2. 다른 공과 부딪혔을 때 당구공처럼 서로 튕김
      for (let j = i + 1; j < orbs.length; j++) {
        const other = orbs[j];
        if (other.collected) continue;
        const odx = other.x - orb.x;
        const odz = other.z - orb.z;
        const odist = Math.hypot(odx, odz);
        if (odist < 1.05 && odist > 0.001) {
          const onx = odx / odist;
          const onz = odz / odist;
          const push = (1.05 - odist) * 0.5;
          orb.x -= onx * push;
          orb.z -= onz * push;
          other.x += onx * push;
          other.z += onz * push;

          const avgSpeed = Math.max(
            4.5,
            Math.hypot(orb.vx, orb.vz, other.vx, other.vz) * 0.7
          );
          orb.vx = -onx * avgSpeed;
          orb.vz = -onz * avgSpeed;
          other.vx = onx * avgSpeed;
          other.vz = onz * avgSpeed;
          anyOrbActive = true;
        }
      }

      // 3. 속도 기반 이동 및 잔디 마찰력 감속
      const currentSpeed = Math.hypot(orb.vx, orb.vz);
      if (currentSpeed > 0.08) {
        anyOrbActive = true;
        orb.x += orb.vx * dt;
        orb.z += orb.vz * dt;

        // 마찰력 (서서히 멈춤)
        const friction = Math.pow(0.18, dt);
        orb.vx *= friction;
        orb.vz *= friction;

        // 당산나무 기둥이나 맵 가장자리에 닿으면 통! 하고 튕겨 나옴
        const distOrigin = Math.hypot(orb.x, orb.z);
        if (distOrigin > 23.5) {
          const bx = orb.x / distOrigin;
          const bz = orb.z / distOrigin;
          orb.x = bx * 23.4;
          orb.z = bz * 23.4;
          orb.vx *= -0.75;
          orb.vz *= -0.75;
        } else if (distOrigin < 2.2) {
          const bx = orb.x / (distOrigin || 1);
          const bz = orb.z / (distOrigin || 1);
          orb.x = bx * 2.25;
          orb.z = bz * 2.25;
          orb.vx = bx * 6.0;
          orb.vz = bz * 6.0;
        }
      } else {
        orb.vx = 0;
        orb.vz = 0;
      }

      // 4. 복바구니(x:0, z:6.0) 주변에 오면 바구니 속으로 빨려 들어가며 골인!
      const distToBasket = Math.hypot(orb.x - altarX, orb.z - altarZ);
      if (distToBasket < 2.3 && distToBasket > 1.35) {
        // 바구니 테두리 자석 인력
        orb.vx += ((altarX - orb.x) / distToBasket) * 12 * dt;
        orb.vz += ((altarZ - orb.z) / distToBasket) * 12 * dt;
        anyOrbActive = true;
      } else if (distToBasket <= 1.35) {
        orb.collected = true;
        orb.vx = 0;
        orb.vz = 0;
        newlyCollected = true;
        anyOrbActive = true;
      }
    }

    if (
      newlyCollected ||
      (anyOrbActive && now - lastOrbSyncTime.current > 0.08)
    ) {
      lastOrbSyncTime.current = now;
      const cloned = orbs.map((o) => ({
        ...o,
        x: Number(o.x.toFixed(2)),
        z: Number(o.z.toFixed(2)),
        vx: Number(o.vx.toFixed(2)),
        vz: Number(o.vz.toFixed(2)),
      }));
      onOrbPushed(cloned, newlyCollected);
    }

    const groundY = getTerrainHeight(posRef.current.x, posRef.current.z);
    const hopOffset = isMoving ? Math.abs(Math.sin(hopTimer.current)) * 0.34 : 0;

    let actionY = 0;
    bodyRef.current.rotation.set(0, 0, 0);
    bodyRef.current.scale.set(1, 1, 1);

    if (myAction === 'jump' || highFiveSpark) {
      actionY = Math.abs(Math.sin(now * 13)) * 0.95;
      bodyRef.current.rotation.y = now * 10;
    } else if (myAction === 'roll') {
      bodyRef.current.rotation.x = now * 12;
    } else if (myAction === 'bow') {
      bodyRef.current.rotation.x = Math.abs(Math.sin(now * 6)) * 0.65;
    } else if (myAction === 'sit') {
      bodyRef.current.scale.set(1.26, 0.66, 1.26);
      actionY = -0.14;
    } else if (isMoving) {
      const squash = Math.sin(hopTimer.current * 2) * 0.13;
      bodyRef.current.scale.set(1 - squash * 0.5, 1 + squash, 1 - squash * 0.5);
    }

    groupRef.current.position.set(
      posRef.current.x,
      groundY + 0.45 + hopOffset + actionY,
      posRef.current.z
    );
    groupRef.current.rotation.y = rotRef.current;

    if (
      onPositionBroadcast &&
      ((isMoving && now - lastBroadcastTime.current > 0.1) ||
        (wasMovingRef.current && !isMoving))
    ) {
      lastBroadcastTime.current = now;
      onPositionBroadcast({
        x: Number(posRef.current.x.toFixed(2)),
        z: Number(posRef.current.z.toFixed(2)),
        rot: Number(rotRef.current.toFixed(2)),
        isMoving,
      });
    }
    wasMovingRef.current = isMoving;

    if (controlsRef.current) {
      if (focusedTarget && cameraTransitionTimer.current > 0) {
        cameraTransitionTimer.current -= dt;
        const focusVec = new THREE.Vector3(...focusedTarget);
        controlsRef.current.target.lerp(focusVec, 6 * dt);
      } else if (cameraMode === 'follow' && !focusedTarget) {
        const playerTarget = new THREE.Vector3(
          posRef.current.x,
          groundY + 1.2,
          posRef.current.z
        );
        const prevTarget = controlsRef.current.target.clone();
        controlsRef.current.target.lerp(playerTarget, 8 * dt);
        const diff = controlsRef.current.target.clone().sub(prevTarget);
        state.camera.position.add(diff);
      } else if (cameraMode === 'tree' && cameraTransitionTimer.current > 0) {
        cameraTransitionTimer.current -= dt;
        const treeTarget = new THREE.Vector3(0, 6.2, 0);
        controlsRef.current.target.lerp(treeTarget, 5 * dt);
      } else if (cameraMode === 'sky' && cameraTransitionTimer.current > 0) {
        cameraTransitionTimer.current -= dt;
        const skyTarget = new THREE.Vector3(0, 17.5, 0);
        const skyCamPos = new THREE.Vector3(0, 4.5, 14);
        controlsRef.current.target.lerp(skyTarget, 4 * dt);
        state.camera.position.lerp(skyCamPos, 3.5 * dt);
      }
    }

    const distToTree = Math.hypot(posRef.current.x, posRef.current.z);
    const isNearNow = distToTree < 5.8;
    if (isNearNow !== nearRef.current) {
      nearRef.current = isNearNow;
      onNearTreeChange(isNearNow);
    }
  });

  return (
    <group
      ref={groupRef}
      position={[
        initialPos.current.x,
        getTerrainHeight(initialPos.current.x, initialPos.current.z) + 0.45,
        initialPos.current.z,
      ]}
    >
      {!hideLabels && (
        <Html
          position={[0, 1.3, 0]}
          center
          distanceFactor={14}
          zIndexRange={[10, 0]}
        >
          <div className="flex flex-col items-center pointer-events-none">
            {myEmote && (
              <div className="mb-1 px-2.5 py-0.5 bg-amber-400 text-stone-950 rounded-full text-xs font-extrabold shadow-md animate-bounce whitespace-nowrap">
                {myEmote}
              </div>
            )}
            <div className="px-2.5 py-0.5 bg-white/95 backdrop-blur-sm rounded-full text-[11px] font-extrabold text-lime-950 shadow-md border border-lime-700/30 whitespace-nowrap flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: myColor }}
              />
              <span>{myNickname} (나)</span>
            </div>
          </div>
        </Html>
      )}

      {(myAction === 'jump' || highFiveSpark) && (
        <Sparkles count={28} scale={2.2} size={5} speed={2} color="#fde047" />
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
          <meshToonMaterial color={myColor} />
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