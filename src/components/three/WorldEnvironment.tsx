import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { getTerrainHeight } from '../../utils/terrain';

export const TraditionalClouds = ({ isNightMode }: { isNightMode: boolean }) => {
  const cloudsRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!cloudsRef.current) return;
    cloudsRef.current.rotation.y = state.clock.elapsedTime * 0.012;
  });

  const cloudPositions: [number, number, number, number][] = [
    [-18, 14, -18, 1.3],
    [20, 15, -14, 1.5],
    [-22, 13, 8, 1.1],
    [16, 14, 16, 1.2],
  ];

  const cloudColor = isNightMode ? '#cbd5e1' : '#f4f7e6';

  return (
    <group ref={cloudsRef}>
      {cloudPositions.map(([x, y, z, scale], idx) => (
        <Float key={idx} speed={1.0} rotationIntensity={0.03} floatIntensity={0.4}>
          <group position={[x, y, z]} scale={scale}>
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[1.6, 12, 12]} />
              <meshToonMaterial color={cloudColor} />
            </mesh>
            <mesh position={[1.5, -0.2, 0.2]}>
              <sphereGeometry args={[1.2, 10, 10]} />
              <meshToonMaterial color={cloudColor} />
            </mesh>
            <mesh position={[-1.5, -0.3, -0.1]}>
              <sphereGeometry args={[1.1, 10, 10]} />
              <meshToonMaterial color={cloudColor} />
            </mesh>
          </group>
        </Float>
      ))}
    </group>
  );
};

export const UnifiedHillTerrain = ({
  onGroundClick,
}: {
  onGroundClick?: (pt: { x: number; z: number }) => void;
}) => {
  const pointerDownPos = useRef({ x: 0, y: 0 });

  // 지형 폴리곤 수를 72x72로 최적화하여 모바일 GPU 속도 향상
  const terrainGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(64, 64, 72, 72);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors: number[] = [];
    const baseColor = new THREE.Color('#689f38');
    const peakColor = new THREE.Color('#8bc34a');

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = getTerrainHeight(x, z);
      pos.setY(i, y);

      const mixRatio = THREE.MathUtils.clamp((y + 0.5) / 5.5, 0, 1);
      const c = baseColor.clone().lerp(peakColor, mixRatio);
      colors.push(c.r, c.g, c.b);
    }

    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  // 드로우콜 병목을 일으키던 510개 꽃잎 메쉬를 32개 초경량 꽃송이로 최적화
  const flowers = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 32; i++) {
      const angle = (i * Math.PI * 2) / 32 + (Math.random() - 0.5) * 0.2;
      const radius = 5.0 + (i % 5) * 3.8;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = getTerrainHeight(x, z);
      arr.push({
        x,
        y,
        z,
        scale: 0.75 + (i % 3) * 0.25,
        color: i % 2 === 0 ? '#e64a19' : '#facc15',
      });
    }
    return arr;
  }, []);

  return (
    <group>
      <mesh
        geometry={terrainGeo}
        receiveShadow
        onPointerDown={(e) => {
          pointerDownPos.current = { x: e.clientX, y: e.clientY };
        }}
        onClick={(e) => {
          const dragDist = Math.hypot(
            e.clientX - pointerDownPos.current.x,
            e.clientY - pointerDownPos.current.y
          );
          if (dragDist < 12 && onGroundClick) {
            e.stopPropagation();
            onGroundClick({ x: e.point.x, z: e.point.z });
          }
        }}
      >
        <meshToonMaterial vertexColors />
      </mesh>

      {flowers.map((f, idx) => (
        <mesh
          key={idx}
          position={[f.x, f.y + 0.08, f.z]}
          scale={f.scale}
        >
          <dodecahedronGeometry args={[0.18, 0]} />
          <meshToonMaterial color={f.color} />
        </mesh>
      ))}
    </group>
  );
};

export const WishTreeAndGuardian = ({
  onPetGuardian,
  hideLabels = false,
  showGreeting = false,
}: {
  onPetGuardian: () => void;
  hideLabels?: boolean;
  showGreeting?: boolean;
}) => {
  const treeBaseY = getTerrainHeight(0, 0);
  const guardianY = getTerrainHeight(0, 2.3);
  const guardianGroupRef = useRef<THREE.Group>(null);
  const broomRef = useRef<THREE.Group>(null);
  const [pettedTimer, setPettedTimer] = useState(0);

  useFrame((state, delta) => {
    if (pettedTimer > 0 && guardianGroupRef.current) {
      const next = Math.max(0, pettedTimer - delta);
      setPettedTimer(next);
      const jump = Math.abs(Math.sin(next * 14)) * 0.45;
      guardianGroupRef.current.position.y = guardianY + jump;
      guardianGroupRef.current.rotation.y = Math.sin(next * 18) * 0.22;
    } else if (guardianGroupRef.current) {
      guardianGroupRef.current.position.y = guardianY;
      guardianGroupRef.current.rotation.y = 0;
    }

    if (broomRef.current) {
      broomRef.current.rotation.z =
        -0.25 + Math.sin(state.clock.elapsedTime * 3) * 0.08;
    }
  });

  const handleTouchGuardian = () => {
    setPettedTimer(1.8);
    onPetGuardian();
  };

  return (
    <group>
      {/* --- 당산나무 --- */}
      <group position={[0, treeBaseY, 0]}>
        <mesh position={[0, 2.2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.7, 1.15, 4.5, 12]} />
          <meshToonMaterial color="#5d4037" />
        </mesh>
        <mesh position={[0, 1.8, 0]} rotation={[0.1, 0, 0]}>
          <torusGeometry args={[0.92, 0.08, 8, 20]} />
          <meshToonMaterial color="#facc15" />
        </mesh>

        <mesh position={[0, 5.1, 0]} castShadow>
          <sphereGeometry args={[3.3, 18, 18]} />
          <meshToonMaterial color="#33691e" />
        </mesh>
        <mesh position={[-2.1, 4.3, 1.4]}>
          <sphereGeometry args={[2.1, 14, 14]} />
          <meshToonMaterial color="#558b2f" />
        </mesh>
        <mesh position={[2.2, 4.4, 1.2]}>
          <sphereGeometry args={[2.2, 14, 14]} />
          <meshToonMaterial color="#558b2f" />
        </mesh>
        <mesh position={[0, 4.6, -2.1]}>
          <sphereGeometry args={[2.3, 14, 14]} />
          <meshToonMaterial color="#33691e" />
        </mesh>
        <mesh position={[0, 6.6, 0]}>
          <sphereGeometry args={[2.2, 14, 14]} />
          <meshToonMaterial color="#689f38" />
        </mesh>
      </group>

      {/* --- 홍보영상 시그니처 스타일로 리모델링된 수호신 '복쓸싸리' --- */}
      <group
        ref={guardianGroupRef}
        position={[0, guardianY, 2.3]}
        onClick={(e) => {
          e.stopPropagation();
          handleTouchGuardian();
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        {/* 1. 층층이 흘러내리는 복슬복슬한 장모(長毛) 구름 몸통 */}
        <mesh position={[0, 0.85, 0]} scale={[1.15, 0.95, 1.0]} castShadow>
          <sphereGeometry args={[0.98, 18, 18]} />
          <meshToonMaterial color="#ffffff" />
        </mesh>
        {/* 양옆 어깨부터 아래로 풍성하게 퍼지는 털결 볼륨 */}
        {[-0.68, 0.68].map((sx, i) => (
          <group key={i}>
            <mesh position={[sx, 0.65, 0.12]}>
              <sphereGeometry args={[0.58, 12, 12]} />
              <meshToonMaterial color="#ffffff" />
            </mesh>
            <mesh position={[sx * 1.15, 0.35, 0.08]}>
              <sphereGeometry args={[0.42, 10, 10]} />
              <meshToonMaterial color="#ffffff" />
            </mesh>
          </group>
        ))}

        {/* 2. 포동포동한 얼굴 & 양갈래로 늘어진 긴 귀/볼털 */}
        <mesh position={[0, 1.78, 0.15]} scale={[1.12, 0.96, 0.98]} castShadow>
          <sphereGeometry args={[0.8, 18, 18]} />
          <meshToonMaterial color="#ffffff" />
        </mesh>
        {[-0.68, 0.68].map((ex, i) => (
          <group
            key={i}
            position={[ex, 1.55, 0.16]}
            rotation={[0, 0, i === 0 ? 0.28 : -0.28]}
          >
            <mesh>
              <capsuleGeometry args={[0.28, 0.55, 6, 12]} />
              <meshToonMaterial color="#ffffff" />
            </mesh>
            <mesh position={[i === 0 ? -0.12 : 0.12, -0.22, 0.05]}>
              <sphereGeometry args={[0.24, 10, 10]} />
              <meshToonMaterial color="#ffffff" />
            </mesh>
          </group>
        ))}

        {/* 3. 홍보영상 속 분수처럼 솟은 구름 상투머리 & 검은 테두리 다홍 머리끈 */}
        <group position={[0, 2.68, 0.12]}>
          <mesh position={[-0.1, 0.04, 0]}>
            <sphereGeometry args={[0.32, 12, 12]} />
            <meshToonMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.14, 0.1, 0]}>
            <sphereGeometry args={[0.26, 10, 10]} />
            <meshToonMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0, 0.22, -0.04]}>
            <sphereGeometry args={[0.24, 10, 10]} />
            <meshToonMaterial color="#ffffff" />
          </mesh>
        </group>
        {/* 다홍 머리끈 + 시그니처 블랙 라인 */}
        <mesh position={[0, 2.42, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.25, 0.075, 8, 18]} />
          <meshToonMaterial color="#ff5722" />
        </mesh>
        <mesh position={[0, 2.46, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.26, 0.025, 6, 16]} />
          <meshBasicMaterial color="#1c1917" />
        </mesh>

        {/* 4. 시그니처 이목구비: 앙증맞은 세로 타원 눈 + 하이라이트가 박힌 가로 타원형 왕코 */}
        <mesh position={[-0.22, 1.96, 0.88]} scale={[0.75, 1.35, 0.5]}>
          <sphereGeometry args={[0.072, 10, 10]} />
          <meshBasicMaterial color="#1c1917" />
        </mesh>
        <mesh position={[0.22, 1.96, 0.88]} scale={[0.75, 1.35, 0.5]}>
          <sphereGeometry args={[0.072, 10, 10]} />
          <meshBasicMaterial color="#1c1917" />
        </mesh>

        {/* 가로로 큼직한 타원형 왕코 */}
        <group position={[0, 1.72, 0.92]}>
          <mesh scale={[1.55, 0.98, 0.75]}>
            <sphereGeometry args={[0.16, 14, 14]} />
            <meshBasicMaterial color="#141210" />
          </mesh>
          <mesh position={[-0.06, 0.05, 0.11]}>
            <sphereGeometry args={[0.032, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>

        {/* 5. 복슬복슬한 앞발 2개와 오른손에 쥔 수호신 대형 싸리빗자루 */}
        {[-0.48, 0.48].map((px, i) => (
          <group key={i} position={[px, 0.34, 0.78]}>
            <mesh>
              <sphereGeometry args={[0.34, 12, 12]} />
              <meshToonMaterial color="#ffffff" />
            </mesh>
          </group>
        ))}

        {/* 수호신의 대형 싸리빗자루 */}
        <group ref={broomRef} position={[0.88, 1.15, 0.55]} rotation={[0.15, 0, -0.25]}>
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.07, 0.08, 1.2, 8]} />
            <meshToonMaterial color="#b48a4e" />
          </mesh>
          <mesh position={[0, -0.05, 0]}>
            <cylinderGeometry args={[0.12, 0.15, 0.25, 10]} />
            <meshToonMaterial color="#78552b" />
          </mesh>
          {[-0.14, -0.24].map((ry, idx) => (
            <mesh key={idx} position={[0, ry, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.16 + idx * 0.04, 0.025, 6, 16]} />
              <meshBasicMaterial color="#fef08a" />
            </mesh>
          ))}
          <mesh position={[0, -0.5, 0]}>
            <coneGeometry args={[0.42, 0.85, 10]} />
            <meshToonMaterial color="#a67c37" />
          </mesh>
        </group>

        {/* 가까이 다가갔을 때만 표시되는 말풍선 */}
        {!hideLabels && (showGreeting || pettedTimer > 0) && (
          <Html
            position={[0, 3.3, 0]}
            center
            distanceFactor={15}
            zIndexRange={[10, 0]}
          >
            <div className="px-3 py-1 bg-amber-50/95 border-2 border-amber-500 rounded-full shadow-lg text-center whitespace-nowrap pointer-events-none">
              <span className="text-[11px] font-extrabold text-amber-950">
                {pettedTimer > 0
                  ? '🐾 수호신 복쓸싸리: "참배 고맙개! 만복을 빌어주겠다개 ✨"'
                  : '🐾 복쓸싸리 터치 시 참배 & 기원 올리기 활성화!'}
              </span>
            </div>
          </Html>
        )}
      </group>
    </group>
  );
};