import React from 'react';
import { Html, Sparkles, Float } from '@react-three/drei';
import type { BeanPlot } from '../../types/wish';
import { getTerrainHeight } from '../../utils/terrain';

export const PersonalGardenSystem = ({
  plots,
  hideLabels,
  ownerNickname,
  onInteractPlot,
}: {
  plots: BeanPlot[];
  hideLabels: boolean;
  ownerNickname: string;
  onInteractPlot: (plot: BeanPlot) => void;
}) => {
  const signY = getTerrainHeight(-4.2, 4.5);
  const jarY = getTerrainHeight(4.2, 4.5);

  return (
    <group>
      {/* 1. 내 동산 환영 나무 팻말 & 소원 돌탑 */}
      <group position={[-4.2, signY, 4.5]} rotation={[0, 0.35, 0]}>
        <mesh position={[0, 0.55, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.1, 1.2, 8]} />
          <meshToonMaterial color="#5d4037" />
        </mesh>
        <mesh position={[0, 1.0, 0.06]} castShadow>
          <boxGeometry args={[1.3, 0.55, 0.12]} />
          <meshToonMaterial color="#8d6e63" />
        </mesh>
        {!hideLabels && (
          <Html
            position={[0, 1.55, 0]}
            center
            distanceFactor={15}
            zIndexRange={[10, 0]}
          >
            <div className="px-2.5 py-0.5 bg-amber-950/90 border border-amber-400/60 rounded-full text-[10px] font-extrabold text-amber-100 whitespace-nowrap shadow pointer-events-none">
              🏡 {ownerNickname}의 동산
            </div>
          </Html>
        )}
      </group>

      {/* 2. 우측 전통 액막이 붉은 팥항아리 & 돌탑 */}
      <group position={[4.2, jarY, 4.5]}>
        <mesh position={[0, 0.45, 0]} castShadow>
          <sphereGeometry args={[0.55, 18, 18]} />
          <meshToonMaterial color="#7f1d1d" />
        </mesh>
        <mesh position={[0, 0.9, 0]}>
          <cylinderGeometry args={[0.38, 0.32, 0.18, 16]} />
          <meshToonMaterial color="#450a0a" />
        </mesh>
        {/* 항아리 위 가득 담긴 붉은 팥알들 */}
        <mesh position={[0, 0.98, 0]}>
          <sphereGeometry args={[0.32, 12, 12]} />
          <meshToonMaterial color="#dc2626" />
        </mesh>

        {/* 옆의 작은 소원 돌탑 */}
        <group position={[1.1, 0, -0.4]}>
          <mesh position={[0, 0.18, 0]} castShadow>
            <dodecahedronGeometry args={[0.38, 1]} />
            <meshToonMaterial color="#78716c" />
          </mesh>
          <mesh position={[0, 0.48, 0]} castShadow>
            <dodecahedronGeometry args={[0.26, 1]} />
            <meshToonMaterial color="#a8a29e" />
          </mesh>
          <mesh position={[0, 0.7, 0]} castShadow>
            <dodecahedronGeometry args={[0.16, 1]} />
            <meshToonMaterial color="#d6d3d1" />
          </mesh>
        </group>
      </group>

      {/* 3. 공덕으로 일구는 붉은 팥(赤豆) 텃밭 3칸 */}
      {plots.map((plot) => {
        const y = getTerrainHeight(plot.x, plot.z);
        return (
          <group
            key={plot.id}
            position={[plot.x, y, plot.z]}
            onClick={(e) => {
              e.stopPropagation();
              onInteractPlot(plot);
            }}
            onPointerOver={() => (document.body.style.cursor = 'pointer')}
            onPointerOut={() => (document.body.style.cursor = 'auto')}
          >
            {/* 기름진 흙 이랑 */}
            <mesh position={[0, 0.06, 0]} receiveShadow>
              <cylinderGeometry args={[1.05, 1.2, 0.22, 20]} />
              <meshToonMaterial color="#4e342e" />
            </mesh>
            <mesh position={[0, 0.17, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.92, 1.06, 20]} />
              <meshBasicMaterial color="#795548" side={2} />
            </mesh>

            {/* [단계 1: 새싹] */}
            {plot.stage === 'sprout' && (
              <group position={[0, 0.2, 0]}>
                <mesh position={[0, 0.12, 0]}>
                  <cylinderGeometry args={[0.03, 0.04, 0.25, 8]} />
                  <meshToonMaterial color="#4ade80" />
                </mesh>
                <mesh position={[-0.1, 0.22, 0]} rotation={[0, 0, 0.5]}>
                  <sphereGeometry args={[0.09, 10, 10]} />
                  <meshToonMaterial color="#22c55e" />
                </mesh>
                <mesh position={[0.1, 0.22, 0]} rotation={[0, 0, -0.5]}>
                  <sphereGeometry args={[0.09, 10, 10]} />
                  <meshToonMaterial color="#22c55e" />
                </mesh>
              </group>
            )}

            {/* [단계 2: 무성한 팥 줄기] */}
            {plot.stage === 'growing' && (
              <group position={[0, 0.2, 0]}>
                <mesh position={[0, 0.35, 0]} castShadow>
                  <sphereGeometry args={[0.42, 14, 14]} />
                  <meshToonMaterial color="#16a34a" />
                </mesh>
                <mesh position={[-0.25, 0.25, 0.15]}>
                  <sphereGeometry args={[0.28, 12, 12]} />
                  <meshToonMaterial color="#22c55e" />
                </mesh>
                <mesh position={[0.25, 0.25, -0.1]}>
                  <sphereGeometry args={[0.28, 12, 12]} />
                  <meshToonMaterial color="#22c55e" />
                </mesh>
              </group>
            )}

            {/* [단계 3: 수확 가능한 영험한 붉은 팥 열매] */}
            {plot.stage === 'ready' && (
              <Float speed={3} rotationIntensity={0.05} floatIntensity={0.2}>
                <group position={[0, 0.22, 0]}>
                  <mesh position={[0, 0.38, 0]} castShadow>
                    <sphereGeometry args={[0.48, 16, 16]} />
                    <meshToonMaterial color="#15803d" />
                  </mesh>
                  {/* 주렁주렁 열린 붉은 팥알들 */}
                  {[
                    [-0.28, 0.45, 0.28],
                    [0.28, 0.48, 0.25],
                    [0, 0.68, 0.22],
                    [-0.22, 0.58, -0.25],
                    [0.25, 0.42, -0.25],
                  ].map(([bx, by, bz], i) => (
                    <mesh key={i} position={[bx, by, bz]} castShadow>
                      <sphereGeometry args={[0.14, 12, 12]} />
                      <meshStandardMaterial
                        color="#dc2626"
                        emissive="#ef4444"
                        emissiveIntensity={0.8}
                      />
                    </mesh>
                  ))}
                  <Sparkles
                    count={14}
                    scale={1.5}
                    position={[0, 0.5, 0]}
                    size={4}
                    color="#fca5a5"
                  />
                </group>
              </Float>
            )}

            {/* 텃밭 상태 안내 배지 */}
            {!hideLabels && (
              <Html
                position={[0, 1.15, 0]}
                center
                distanceFactor={14}
                zIndexRange={[10, 0]}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onInteractPlot(plot);
                  }}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold whitespace-nowrap shadow-md border transition active:scale-95 ${
                    plot.stage === 'ready'
                      ? 'bg-red-700 text-amber-100 border-amber-300 ring-2 ring-amber-300/60 animate-bounce'
                      : plot.stage === 'empty'
                      ? 'bg-stone-900/85 text-amber-200 border-amber-400/50 hover:bg-stone-800'
                      : 'bg-lime-900/85 text-lime-100 border-lime-400/40'
                  }`}
                >
                  {plot.stage === 'empty' && '🌱 팥 심기 (🔮공덕 5)'}
                  {plot.stage === 'sprout' && '🌿 새싹 자라는 중... (🧹쓸면 즉시 완성)'}
                  {plot.stage === 'growing' && '🌿 영그는 중... (🧹쓸면 즉시 완성)'}
                  {plot.stage === 'ready' && '🫘 붉은 팥 수확하기! (+2알)'}
                </button>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
};