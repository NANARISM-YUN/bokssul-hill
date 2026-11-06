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
  onOrbPushed: (orbs: RollingOrb[]) => void;
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
    z: 7.5 + Math.random() * 2,
  });
  const posRef = useRef({ x: initialPos.current.x, z: initialPos.current.z });
  const rotRef = useRef(Math.PI);
  const hopTimer = useRef(0);
  const nearRef = useRef(false);
  const lastBroadcastTime = useRef(0);
  const wasMovingRef = useRef(false);
  const lastHighFiveTime = useRef(0);
  const [highFiveSpark, setHighFiveSpark] = useState(false);

  // 카메라 시점 전환 시 처음 1.2초 동안만 부드럽게 잡아주고 이후 자유 회전 허용
  const cameraTransitionTimer = useRef(0);
  useEffect(() => {
    cameraTransitionTimer.current = 1.25;
  }, [cameraMode, focusedTarget]);

  useFrame((state, delta) => {
    if (!groupRef.current || !bodyRef.current) return;

    const speed = 5.8;
    let inputX = joystickVec.current.x;
    let inputZ = joystickVec.current.y;

    if (keys.current['ArrowUp'] || keys.current['KeyW']) inputZ -= 1;
    if (keys.current['ArrowDown'] || keys.current['KeyS']) inputZ += 1;
    if (keys.current['ArrowLeft'] || keys.current['KeyA']) inputX -= 1;
    if (keys.current['ArrowRight'] || keys.current['KeyD']) inputX += 1;

    const hasManualInput = Math.hypot(inputX, inputZ) > 0.05;

    // 수동 조작 시 자동 이동/따라가기 해제
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
      // [6번] 기차놀이: 선택한 친구 복쓸덩이 뒤를 졸졸 따라가기
      const dx = followingPlayer.x - posRef.current.x;
      const dz = followingPlayer.z - posRef.current.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 1.35) {
        isMoving = true;
        moveVec.set(dx / dist, 0, dz / dist);
      }
    } else if (clickTarget) {
      // [1번] 바닥 터치 지점으로 자동 이동
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
      posRef.current.x += moveVec.x * speed * moveLen * delta;
      posRef.current.z += moveVec.z * speed * moveLen * delta;

      const distFromOrigin = Math.hypot(posRef.current.x, posRef.current.z);
      if (distFromOrigin > 26) {
        posRef.current.x = (posRef.current.x / distFromOrigin) * 26;
        posRef.current.z = (posRef.current.z / distFromOrigin) * 26;
      }
      if (distFromOrigin < 2.2) {
        posRef.current.x = (posRef.current.x / distFromOrigin) * 2.2;
        posRef.current.z = (posRef.current.z / distFromOrigin) * 2.2;
      }

      const targetRot = Math.atan2(moveVec.x, moveVec.z);
      rotRef.current = THREE.MathUtils.lerp(
        rotRef.current,
        targetRot,
        12 * delta
      );
      hopTimer.current += delta * 15;
    } else {
      hopTimer.current = 0;
    }

    // [5번] 다른 복쓸덩이와 가까이 만나면 '박치기 하이파이브' 바운스!
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

    // [8+10번] 황금 복구슬 몸으로 밀기 & 제단(x:0, z:6.2) 골인 판정
    let orbChanged = false;
    const updatedOrbs = orbsRef.current.map((orb) => {
      if (orb.collected) return orb;
      const dx = orb.x - posRef.current.x;
      const dz = orb.z - posRef.current.z;
      const dist = Math.hypot(dx, dz);

      if (dist < 1.15 && dist > 0.001) {
        orbChanged = true;
        const pushSpeed = 8.5 * delta;
        const nx = orb.x + (dx / dist) * pushSpeed;
        const nz = orb.z + (dz / dist) * pushSpeed;
        const distToAltar = Math.hypot(nx - 0, nz - 6.2);
        return {
          ...orb,
          x: Number(nx.toFixed(2)),
          z: Number(nz.toFixed(2)),
          collected: distToAltar < 1.75,
        };
      }
      return orb;
    });

    if (orbChanged) {
      orbsRef.current = updatedOrbs;
      onOrbPushed(updatedOrbs);
    }

    const groundY = getTerrainHeight(posRef.current.x, posRef.current.z);
    const hopOffset = isMoving ? Math.abs(Math.sin(hopTimer.current)) * 0.34 : 0;

    // [2번 & 4번] 말랑 텐션(Squash & Stretch) 및 4대 바디랭귀지 모션
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

    // --- 카메라 제어 (하늘 시점 자유 회전 지원) ---
    if (controlsRef.current) {
      if (focusedTarget && cameraTransitionTimer.current > 0) {
        cameraTransitionTimer.current -= delta;
        const focusVec = new THREE.Vector3(...focusedTarget);
        controlsRef.current.target.lerp(focusVec, 6 * delta);
      } else if (cameraMode === 'follow' && !focusedTarget) {
        const playerTarget = new THREE.Vector3(
          posRef.current.x,
          groundY + 1.2,
          posRef.current.z
        );
        const prevTarget = controlsRef.current.target.clone();
        controlsRef.current.target.lerp(playerTarget, 8 * delta);
        const diff = controlsRef.current.target.clone().sub(prevTarget);
        state.camera.position.add(diff);
      } else if (cameraMode === 'tree' && cameraTransitionTimer.current > 0) {
        cameraTransitionTimer.current -= delta;
        const treeTarget = new THREE.Vector3(0, 6.2, 0);
        controlsRef.current.target.lerp(treeTarget, 5 * delta);
      } else if (cameraMode === 'sky' && cameraTransitionTimer.current > 0) {
        // 하늘 시점으로 전환될 때 처음 1.2초 동안만 천문대 각도로 올려다보고 이후에는 자유 회전!
        cameraTransitionTimer.current -= delta;
        const skyTarget = new THREE.Vector3(0, 17.5, 0);
        const skyCamPos = new THREE.Vector3(0, 4.5, 14);
        controlsRef.current.target.lerp(skyTarget, 4 * delta);
        state.camera.position.lerp(skyCamPos, 3.5 * delta);
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