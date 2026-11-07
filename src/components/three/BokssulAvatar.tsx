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
      {/* --- 1. 홍보영상 속 몽글몽글한 구름 실루엣 몸통 --- */}
      <mesh position={[0, 0.02, 0]} scale={[1.12, 0.96, 1.02]} castShadow>
        <sphereGeometry args={[0.45, 18, 18]} />
        <meshToonMaterial color="#ffffff" />
      </mesh>
      {/* 양볼과 옆구리의 구름 볼륨 퍼프 */}
      <mesh position={[-0.31, -0.02, 0.06]}>
        <sphereGeometry args={[0.29, 12, 12]} />
        <meshToonMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.31, -0.02, 0.06]}>
        <sphereGeometry args={[0.29, 12, 12]} />
        <meshToonMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-0.22, 0.24, 0]}>
        <sphereGeometry args={[0.25, 12, 12]} />
        <meshToonMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.22, 0.24, 0]}>
        <sphereGeometry args={[0.25, 12, 12]} />
        <meshToonMaterial color="#ffffff" />
      </mesh>

      {/* --- 2. 시그니처 비대칭 구름 사과머리(똥머리) & 머리끈 --- */}
      <group position={[0, 0.56, 0]}>
        <mesh position={[-0.04, 0.04, 0]}>
          <sphereGeometry args={[0.19, 12, 12]} />
          <meshToonMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0.09, 0.08, 0]}>
          <sphereGeometry args={[0.15, 10, 10]} />
          <meshToonMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0.14, -0.03]}>
          <sphereGeometry args={[0.14, 10, 10]} />
          <meshToonMaterial color="#ffffff" />
        </mesh>
      </group>
      {/* 사과머리 묶음 끈 (유저 퍼스널 컬러 + 시그니처 블랙 라인 포인트) */}
      <mesh position={[0, 0.42, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.14, 0.042, 8, 18]} />
        <meshToonMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.44, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.145, 0.015, 6, 16]} />
        <meshBasicMaterial color="#1c1917" />
      </mesh>

      {/* --- 3. 시그니처 이목구비: 앙증맞은 세로 타원 눈 + 커다란 가로 타원 왕코 --- */}
      {/* 왼쪽 눈 */}
      <mesh position={[-0.11, 0.12, 0.45]} scale={[0.75, 1.35, 0.5]}>
        <sphereGeometry args={[0.036, 8, 8]} />
        <meshBasicMaterial color="#1c1917" />
      </mesh>
      {/* 오른쪽 눈 */}
      <mesh position={[0.11, 0.12, 0.45]} scale={[0.75, 1.35, 0.5]}>
        <sphereGeometry args={[0.036, 8, 8]} />
        <meshBasicMaterial color="#1c1917" />
      </mesh>

      {/* 커다란 가로 타원형 까만 왕코 + 하얀 반짝이 하이라이트 점 */}
      <group position={[0, -0.02, 0.47]}>
        <mesh scale={[1.55, 0.98, 0.75]}>
          <sphereGeometry args={[0.088, 14, 14]} />
          <meshBasicMaterial color="#141210" />
        </mesh>
        <mesh position={[-0.035, 0.028, 0.062]}>
          <sphereGeometry args={[0.018, 6, 6]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>

      {/* --- 4. 앙증맞은 짧은 다리 4개와 뒷면 복슬 꼬리 --- */}
      <mesh position={[-0.19, -0.36, 0.14]} rotation={[0, 0, 0.12]}>
        <capsuleGeometry args={[0.065, 0.08, 4, 8]} />
        <meshToonMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.19, -0.36, 0.14]} rotation={[0, 0, -0.12]}>
        <capsuleGeometry args={[0.065, 0.08, 4, 8]} />
        <meshToonMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-0.17, -0.36, -0.16]}>
        <capsuleGeometry args={[0.06, 0.07, 4, 8]} />
        <meshToonMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.17, -0.36, -0.16]}>
        <capsuleGeometry args={[0.06, 0.07, 4, 8]} />
        <meshToonMaterial color="#ffffff" />
      </mesh>

      {/* 오른쪽 뒤편에 삐죽 나온 복슬복슬한 꼬리 */}
      <group position={[0.3, -0.18, -0.28]} rotation={[0, 0, -0.5]}>
        <mesh>
          <sphereGeometry args={[0.11, 8, 8]} />
          <meshToonMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0.06, -0.04, 0]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshToonMaterial color="#ffffff" />
        </mesh>
      </group>

      {/* 플러그인 1: 머리 위 보상화 개화 */}
      <BosanghwaHeadpiece karma={karma} flowerType={flowerType} />

      {/* 플러그인 2: 홍보영상 스타일 싸리빗자루 */}
      <SsariBroomMesh isSweeping={isSweeping} />
    </group>
  );
});