import React, { forwardRef } from 'react';
import * as THREE from 'three';
import type { FlowerType } from '../../types/wish';
import { BosanghwaHeadpiece, SsariBroomMesh } from './BosanghwaFlower';

export const BokssulAvatarMesh = forwardRef<
  THREE.Group,
  {
    color: string;
    karma?: number;
    flowerType?: FlowerType;
    isSweeping?: boolean;
  }
>(({ color, karma = 0, flowerType = 'pink_lotus', isSweeping = false }, ref) => {
  return (
    <group ref={ref}>
      {/* 복쓸덩이 구름 몸통 */}
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

      {/* 사과머리 & 컬러 머리끈 */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshToonMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.14, 0.05, 8, 20]} />
        <meshToonMaterial color={color} />
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

      {/* 플러그인 1: 머리 위 보상화 개화 */}
      <BosanghwaHeadpiece karma={karma} flowerType={flowerType} />

      {/* 플러그인 2: 액운 정화용 싸리빗자루 */}
      <SsariBroomMesh isSweeping={isSweeping} />
    </group>
  );
});