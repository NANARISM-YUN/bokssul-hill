import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import type { CameraMode } from '../../types/wish';
import { getTerrainHeight } from '../../utils/terrain';

export const BokssulPlayerAndCamera = ({
  keys,
  joystickVec,
  controlsRef,
  cameraMode,
  focusedTarget,
  onNearTreeChange,
  hideLabels = false,
}: {
  keys: React.MutableRefObject<{ [key: string]: boolean }>;
  joystickVec: React.MutableRefObject<{ x: number; y: number }>;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  cameraMode: CameraMode;
  focusedTarget: [number, number, number] | null;
  onNearTreeChange: (isNear: boolean) => void;
  hideLabels?: boolean;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const posRef = useRef({ x: 0, z: 8.5 });
  const rotRef = useRef(Math.PI);
  const hopTimer = useRef(0);
  const nearRef = useRef(false);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const speed = 5.8;
    let inputX = joystickVec.current.x;
    let inputZ = joystickVec.current.y;

    if (keys.current['ArrowUp'] || keys.current['KeyW']) inputZ -= 1;
    if (keys.current['ArrowDown'] || keys.current['KeyS']) inputZ += 1;
    if (keys.current['ArrowLeft'] || keys.current['KeyA']) inputX -= 1;
    if (keys.current['ArrowRight'] || keys.current['KeyD']) inputX += 1;

    const isMoving = Math.hypot(inputX, inputZ) > 0.05;

    if (isMoving) {
      const len = Math.min(1, Math.hypot(inputX, inputZ));
      const normX = inputX / (Math.hypot(inputX, inputZ) || 1);
      const normZ = inputZ / (Math.hypot(inputX, inputZ) || 1);

      const camForward = new THREE.Vector3();
      state.camera.getWorldDirection(camForward);
      camForward.y = 0;
      camForward.normalize();
      const camRight = new THREE.Vector3(-camForward.z, 0, camForward.x);

      const moveVec = new THREE.Vector3()
        .addScaledVector(camRight, normX)
        .addScaledVector(camForward, -normZ)
        .normalize();

      posRef.current.x += moveVec.x * speed * len * delta;
      posRef.current.z += moveVec.z * speed * len * delta;

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
      rotRef.current = THREE.MathUtils.lerp(rotRef.current, targetRot, 12 * delta);
      hopTimer.current += delta * 15;
    } else {
      hopTimer.current = 0;
    }

    const groundY = getTerrainHeight(posRef.current.x, posRef.current.z);
    const hopOffset = isMoving ? Math.abs(Math.sin(hopTimer.current)) * 0.32 : 0;

    groupRef.current.position.set(
      posRef.current.x,
      groundY + 0.45 + hopOffset,
      posRef.current.z
    );
    groupRef.current.rotation.y = rotRef.current;

    if (controlsRef.current) {
      if (focusedTarget) {
        const focusVec = new THREE.Vector3(...focusedTarget);
        controlsRef.current.target.lerp(focusVec, 6 * delta);
      } else if (cameraMode === 'follow') {
        const playerTarget = new THREE.Vector3(
          posRef.current.x,
          groundY + 1.2,
          posRef.current.z
        );
        const prevTarget = controlsRef.current.target.clone();
        controlsRef.current.target.lerp(playerTarget, 8 * delta);
        const diff = controlsRef.current.target.clone().sub(prevTarget);
        state.camera.position.add(diff);
      } else if (cameraMode === 'tree') {
        const treeTarget = new THREE.Vector3(0, 6.8, 0);
        controlsRef.current.target.lerp(treeTarget, 5 * delta);
      } else if (cameraMode === 'sky') {
        const skyTarget = new THREE.Vector3(0, 19.5, -4);
        const skyCamPos = new THREE.Vector3(0, 5.5, 16);
        controlsRef.current.target.lerp(skyTarget, 4 * delta);
        state.camera.position.lerp(skyCamPos, 3 * delta);
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
    <group ref={groupRef} position={[0, getTerrainHeight(0, 8.5) + 0.45, 8.5]}>
      {!hideLabels && (
        <Html
          position={[0, 1.2, 0]}
          center
          distanceFactor={14}
          zIndexRange={[10, 0]}
        >
          <div className="px-2.5 py-0.5 bg-white/95 backdrop-blur-sm rounded-full text-[11px] font-extrabold text-lime-950 shadow-md border border-lime-700/30 whitespace-nowrap">
            나 (복쓸덩이)
          </div>
        </Html>
      )}

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
        <meshToonMaterial color="#d84315" />
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
  );
};