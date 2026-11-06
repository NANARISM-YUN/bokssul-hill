import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Sparkles } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import type {
  CameraMode,
  PlayerAction,
  RemotePlayer,
} from '../../types/wish';
import { getTerrainHeight } from '../../utils/terrain';
import { BokssulAvatarMesh } from './BokssulAvatar';

export const BokssulPlayerAndCamera = ({
  keys,
  joystickVec,
  clickTarget,
  clearClickTarget,
  followingPlayer,
  stopFollowing,
  remotePlayers,
  playerPosRef,
  playerMoveVecRef,
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
  playerPosRef: React.MutableRefObject<{ x: number; z: number }>;
  playerMoveVecRef: React.MutableRefObject<{
    x: number;
    z: number;
    isMoving: boolean;
  }>;
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
  const rotRef = useRef(Math.PI);
  const hopTimer = useRef(0);
  const nearRef = useRef(false);
  const lastBroadcastTime = useRef(0);
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

    const moveVec = new THREE.Vector3();
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
      const dx = followingPlayer.x - playerPosRef.current.x;
      const dz = followingPlayer.z - playerPosRef.current.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 1.35) {
        isMoving = true;
        moveVec.set(dx / dist, 0, dz / dist);
      }
    } else if (clickTarget) {
      const dx = clickTarget.x - playerPosRef.current.x;
      const dz = clickTarget.z - playerPosRef.current.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.25) {
        isMoving = true;
        moveVec.set(dx / dist, 0, dz / dist);
      } else {
        clearClickTarget();
      }
    }

    if (isMoving) {
      playerPosRef.current.x += moveVec.x * speed * moveLen * dt;
      playerPosRef.current.z += moveVec.z * speed * moveLen * dt;

      const distFromOrigin = Math.hypot(
        playerPosRef.current.x,
        playerPosRef.current.z
      );
      if (distFromOrigin > 25) {
        playerPosRef.current.x = (playerPosRef.current.x / distFromOrigin) * 25;
        playerPosRef.current.z = (playerPosRef.current.z / distFromOrigin) * 25;
      }
      if (distFromOrigin < 2.2) {
        playerPosRef.current.x = (playerPosRef.current.x / distFromOrigin) * 2.2;
        playerPosRef.current.z = (playerPosRef.current.z / distFromOrigin) * 2.2;
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

    // 구슬 물리 엔진이 참조할 내 현재 이동 벡터 업데이트
    playerMoveVecRef.current = {
      x: moveVec.x * speed * moveLen,
      z: moveVec.z * speed * moveLen,
      isMoving,
    };

    const now = state.clock.elapsedTime;
    if (now - lastHighFiveTime.current > 4.0) {
      for (const rp of Object.values(remotePlayers)) {
        const d = Math.hypot(
          rp.x - playerPosRef.current.x,
          rp.z - playerPosRef.current.z
        );
        if (d < 1.05) {
          lastHighFiveTime.current = now;
          setHighFiveSpark(true);
          onHighFive(rp.nickname);
          setTimeout(() => setHighFiveSpark(false), 1800);
          break;
        }
      }
    }

    const groundY = getTerrainHeight(
      playerPosRef.current.x,
      playerPosRef.current.z
    );
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
      playerPosRef.current.x,
      groundY + 0.45 + hopOffset + actionY,
      playerPosRef.current.z
    );
    groupRef.current.rotation.y = rotRef.current;

    if (
      onPositionBroadcast &&
      ((isMoving && now - lastBroadcastTime.current > 0.1) ||
        (wasMovingRef.current && !isMoving))
    ) {
      lastBroadcastTime.current = now;
      onPositionBroadcast({
        x: Number(playerPosRef.current.x.toFixed(2)),
        z: Number(playerPosRef.current.z.toFixed(2)),
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
          playerPosRef.current.x,
          groundY + 1.2,
          playerPosRef.current.z
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

    const distToTree = Math.hypot(
      playerPosRef.current.x,
      playerPosRef.current.z
    );
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
        playerPosRef.current.x,
        getTerrainHeight(playerPosRef.current.x, playerPosRef.current.z) + 0.45,
        playerPosRef.current.z,
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

      <BokssulAvatarMesh ref={bodyRef} color={myColor} />
    </group>
  );
};