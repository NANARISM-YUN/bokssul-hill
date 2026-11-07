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
  const [pettedTimer, setPettedTimer] = useState(0);

  useFrame((_, delta) => {
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
  });

  const handleTouchGuardian = () => {
    setPettedTimer(1.8);
    onPetGuardian();
  };

  return (
    <group>
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
        <mesh position={[0, 0.85, 0]} castShadow>
          <sphereGeometry args={[0.95, 18, 18]} />
          <meshToonMaterial color="#ffffff" />
        </mesh>
        <mesh position={[-0.55, 0.7, 0.15]}>
          <sphereGeometry args={[0.6, 12, 12]} />
          <meshToonMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0.55, 0.7, 0.15]}>
          <sphereGeometry args={[0.6, 12, 12]} />
          <meshToonMaterial color="#ffffff" />
        </mesh>

        <mesh position={[0, 1.75, 0.15]}>
          <sphereGeometry args={[0.78, 16, 16]} />
          <meshToonMaterial color="#ffffff" />
        </mesh>
        <mesh position={[-0.65, 1.55, 0.1]}>
          <capsuleGeometry args={[0.25, 0.5, 6, 12]} />
          <meshToonMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0.65, 1.55, 0.1]}>
          <capsuleGeometry args={[0.25, 0.5, 6, 12]} />
          <meshToonMaterial color="#ffffff" />
        </mesh>

        <mesh position={[0, 2.65, 0.1]}>
          <sphereGeometry args={[0.38, 12, 12]} />
          <meshToonMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 2.38, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.24, 0.08, 8, 16]} />
          <meshToonMaterial color="#d84315" />
        </mesh>

        <mesh position={[0, 1.82, 0.88]}>
          <sphereGeometry args={[0.15, 10, 10]} />
          <meshBasicMaterial color="#1c1917" />
        </mesh>
        <mesh position={[-0.26, 1.98, 0.82]}>
          <sphereGeometry args={[0.08, 10, 10]} />
          <meshBasicMaterial color="#1c1917" />
        </mesh>
        <mesh position={[0.26, 1.98, 0.82]}>
          <sphereGeometry args={[0.08, 10, 10]} />
          <meshBasicMaterial color="#1c1917" />
        </mesh>

        {[-0.48, 0.48].map((px, i) => (
          <group key={i} position={[px, 0.38, 0.82]}>
            <mesh>
              <sphereGeometry args={[0.36, 12, 12]} />
              <meshToonMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0, -0.04, 0.33]}>
              <sphereGeometry args={[0.13, 8, 8]} />
              <meshBasicMaterial color="#1c1917" />
            </mesh>
          </group>
        ))}

        {/* 가까이 다가갔을 때만 말풍선 표시 */}
        {!hideLabels && (showGreeting || pettedTimer > 0) && (
          <Html
            position={[0, 3.15, 0]}
            center
            distanceFactor={15}
            zIndexRange={[10, 0]}
          >
            <div className="px-3 py-1 bg-amber-50/95 border-2 border-amber-500 rounded-full shadow-lg text-center whitespace-nowrap pointer-events-none">
              <span className="text-[11px] font-extrabold text-amber-950">
                {pettedTimer > 0
                  ? '🐾 수호신 복쓸싸리: "참배 고맙개! 복기운을 받으시개 ✨"'
                  : '🐾 복쓸싸리 터치 시 참배 & 기원 올리기 버튼 활성화!'}
              </span>
            </div>
          </Html>
        )}
      </group>
    </group>
  );
};