import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import type { BeanPlot, GardenItemId } from '../../types/wish';
import { getTerrainHeight } from '../../utils/terrain';

// GPU 부하를 유발하던 pointLight를 제거하고 경량 발광 머티리얼로 최적화한 내 동산 조경물
const CustomGardenDecorObjects = ({
  placedDecor,
}: {
  placedDecor: GardenItemId[];
}) => {
  const pagodaOrbRef = useRef<THREE.Mesh>(null);
  const fireRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (pagodaOrbRef.current) {
      pagodaOrbRef.current.rotation.y = t * 2;
      pagodaOrbRef.current.position.y = 2.55 + Math.sin(t * 3) * 0.08;
    }
    if (fireRef.current) {
      const s = 0.92 + Math.sin(t * 10) * 0.12;
      fireRef.current.scale.set(s, 1 + Math.cos(t * 10) * 0.15, s);
    }
  });

  return (
    <group>
      {/* 1. 🔥 따뜻한 모닥불 화로 (마당 정중앙 배치) */}
      {placedDecor.includes('campfire') && (
        <group position={[0, getTerrainHeight(0, 0.5), 0.5]}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const a = (i * Math.PI) / 4;
            return (
              <mesh
                key={i}
                position={[Math.cos(a) * 0.75, 0.12, Math.sin(a) * 0.75]}
              >
                <dodecahedronGeometry args={[0.2, 0]} />
                <meshToonMaterial color="#57534e" />
              </mesh>
            );
          })}
          <mesh position={[0, 0.15, 0]} rotation={[0, 0.4, Math.PI / 2]}>
            <cylinderGeometry args={[0.1, 0.1, 1.0, 8]} />
            <meshToonMaterial color="#451a03" />
          </mesh>
          <mesh position={[0, 0.15, 0]} rotation={[Math.PI / 2, 0.4, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 1.0, 8]} />
            <meshToonMaterial color="#451a03" />
          </mesh>
          <mesh ref={fireRef} position={[0, 0.48, 0]}>
            <coneGeometry args={[0.42, 0.85, 8]} />
            <meshStandardMaterial
              color="#fb923c"
              emissive="#ea580c"
              emissiveIntensity={2.2}
            />
          </mesh>
        </group>
      )}

      {/* 2. 🌸 천년 겹벚꽃 나무 */}
      {placedDecor.includes('cherry_tree') && (
        <group position={[-4.8, getTerrainHeight(-4.8, -1.5), -1.5]}>
          <mesh position={[0, 1.3, 0]} castShadow>
            <cylinderGeometry args={[0.35, 0.55, 2.6, 10]} />
            <meshToonMaterial color="#4e342e" />
          </mesh>
          <mesh position={[0, 2.9, 0]} castShadow>
            <sphereGeometry args={[1.8, 16, 16]} />
            <meshToonMaterial color="#f48fb1" />
          </mesh>
          <mesh position={[-1.1, 2.5, 0.6]}>
            <sphereGeometry args={[1.2, 12, 12]} />
            <meshToonMaterial color="#f8bbd0" />
          </mesh>
          <mesh position={[1.1, 2.6, 0.5]}>
            <sphereGeometry args={[1.2, 12, 12]} />
            <meshToonMaterial color="#f06292" />
          </mesh>
          <Sparkles
            count={18}
            scale={[4, 3, 4]}
            position={[0, 2.2, 0]}
            size={4}
            speed={0.5}
            color="#fce4ec"
          />
        </group>
      )}

      {/* 3. 🪨 오층 황금 소원석탑 */}
      {placedDecor.includes('stone_pagoda') && (
        <group position={[4.8, getTerrainHeight(4.8, -1.5), -1.5]}>
          {[0, 1, 2, 3, 4].map((tier) => {
            const w = 1.3 - tier * 0.2;
            const y = 0.25 + tier * 0.45;
            return (
              <group key={tier} position={[0, y, 0]}>
                <mesh>
                  <boxGeometry args={[w, 0.28, w]} />
                  <meshToonMaterial color="#a8a29e" />
                </mesh>
                <mesh position={[0, 0.18, 0]}>
                  <coneGeometry args={[w * 0.85, 0.18, 4]} />
                  <meshToonMaterial color="#57534e" />
                </mesh>
              </group>
            );
          })}
          <mesh ref={pagodaOrbRef} position={[0, 2.55, 0]}>
            <octahedronGeometry args={[0.24, 0]} />
            <meshStandardMaterial
              color="#fef08a"
              emissive="#f59e0b"
              emissiveIntensity={2.2}
            />
          </mesh>
        </group>
      )}

      {/* 4. 🪵 풍류 대청 평상 */}
      {placedDecor.includes('wood_bench') && (
        <group
          position={[-4.5, getTerrainHeight(-4.5, 7.2), 7.2]}
          rotation={[0, 0.4, 0]}
        >
          <mesh position={[0, 0.32, 0]} receiveShadow>
            <boxGeometry args={[2.5, 0.16, 1.8]} />
            <meshToonMaterial color="#8d6e63" />
          </mesh>
          <mesh position={[0, 0.48, 0]}>
            <cylinderGeometry args={[0.45, 0.4, 0.16, 12]} />
            <meshToonMaterial color="#5d4037" />
          </mesh>
          <mesh position={[0, 0.6, 0]}>
            <sphereGeometry args={[0.18, 10, 10]} />
            <meshToonMaterial color="#dc2626" />
          </mesh>
        </group>
      )}

      {/* 5. 🏮 청사초롱 쌍등 */}
      {placedDecor.includes('lantern_pair') && (
        <group
          position={[4.5, getTerrainHeight(4.5, 7.2), 7.2]}
          rotation={[0, -0.4, 0]}
        >
          {[-0.9, 0.9].map((lx, i) => (
            <group key={i} position={[lx, 0, 0]}>
              <mesh position={[0, 1.1, 0]}>
                <cylinderGeometry args={[0.05, 0.06, 2.2, 8]} />
                <meshToonMaterial color="#4e342e" />
              </mesh>
              <mesh position={[0, 2.1, 0.25]}>
                <boxGeometry args={[0.08, 0.08, 0.6]} />
                <meshToonMaterial color="#4e342e" />
              </mesh>
              <mesh position={[0, 1.82, 0.48]}>
                <cylinderGeometry args={[0.22, 0.22, 0.26, 12]} />
                <meshStandardMaterial
                  color="#dc2626"
                  emissive="#ef4444"
                  emissiveIntensity={1.5}
                />
              </mesh>
              <mesh position={[0, 1.58, 0.48]}>
                <cylinderGeometry args={[0.22, 0.18, 0.26, 12]} />
                <meshStandardMaterial
                  color="#1d4ed8"
                  emissive="#3b82f6"
                  emissiveIntensity={1.5}
                />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* 6. 🎐 액막이 황금 싸리문 */}
      {placedDecor.includes('ssari_gate') && (
        <group position={[0, getTerrainHeight(0, 11.8), 11.8]}>
          <mesh position={[-1.6, 1.25, 0]}>
            <cylinderGeometry args={[0.14, 0.18, 2.5, 8]} />
            <meshToonMaterial color="#5d4037" />
          </mesh>
          <mesh position={[1.6, 1.25, 0]}>
            <cylinderGeometry args={[0.14, 0.18, 2.5, 8]} />
            <meshToonMaterial color="#5d4037" />
          </mesh>
          <mesh position={[0, 2.45, 0]}>
            <boxGeometry args={[3.9, 0.25, 0.55]} />
            <meshToonMaterial color="#4e342e" />
          </mesh>
          <mesh position={[0, 2.1, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.04, 0.04, 3.2, 8]} />
            <meshToonMaterial color="#facc15" />
          </mesh>
          {[-0.8, 0, 0.8].map((px, i) => (
            <mesh key={i} position={[px, 1.92, 0]}>
              <sphereGeometry args={[0.14, 8, 8]} />
              <meshToonMaterial color="#dc2626" />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
};

export const PersonalGardenSystem = ({
  plots,
  placedDecor,
  hideLabels,
  ownerNickname,
  onInteractPlot,
}: {
  plots: BeanPlot[];
  placedDecor: GardenItemId[];
  hideLabels: boolean;
  ownerNickname: string;
  onInteractPlot: (plot: BeanPlot) => void;
}) => {
  const signY = getTerrainHeight(-3.5, 0.2);
  const jarY = getTerrainHeight(3.5, 0.2);

  return (
    <group>
      <CustomGardenDecorObjects placedDecor={placedDecor} />

      {/* 내 동산 문패 */}
      <group position={[-3.5, signY, 0.2]} rotation={[0, 0.25, 0]}>
        <mesh position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.08, 0.1, 1.2, 8]} />
          <meshToonMaterial color="#5d4037" />
        </mesh>
        <mesh position={[0, 1.0, 0.06]}>
          <boxGeometry args={[1.4, 0.55, 0.12]} />
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
              🏡 {ownerNickname}의 아늑한 동산
            </div>
          </Html>
        )}
      </group>

      {/* 액막이 붉은 팥항아리 */}
      <group position={[3.5, jarY, 0.2]}>
        <mesh position={[0, 0.45, 0]}>
          <sphereGeometry args={[0.55, 14, 14]} />
          <meshToonMaterial color="#7f1d1d" />
        </mesh>
        <mesh position={[0, 0.9, 0]}>
          <cylinderGeometry args={[0.38, 0.32, 0.18, 12]} />
          <meshToonMaterial color="#450a0a" />
        </mesh>
        <mesh position={[0, 0.98, 0]}>
          <sphereGeometry args={[0.32, 10, 10]} />
          <meshToonMaterial color="#dc2626" />
        </mesh>
      </group>

      {/* 붉은 팥 텃밭 3칸 */}
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
            <mesh position={[0, 0.06, 0]} receiveShadow>
              <cylinderGeometry args={[1.05, 1.2, 0.22, 16]} />
              <meshToonMaterial color="#4e342e" />
            </mesh>

            {plot.stage === 'sprout' && (
              <group position={[0, 0.2, 0]}>
                <mesh position={[-0.1, 0.22, 0]} rotation={[0, 0, 0.5]}>
                  <sphereGeometry args={[0.09, 8, 8]} />
                  <meshToonMaterial color="#22c55e" />
                </mesh>
                <mesh position={[0.1, 0.22, 0]} rotation={[0, 0, -0.5]}>
                  <sphereGeometry args={[0.09, 8, 8]} />
                  <meshToonMaterial color="#22c55e" />
                </mesh>
              </group>
            )}

            {plot.stage === 'growing' && (
              <group position={[0, 0.2, 0]}>
                <mesh position={[0, 0.35, 0]}>
                  <sphereGeometry args={[0.42, 12, 12]} />
                  <meshToonMaterial color="#16a34a" />
                </mesh>
              </group>
            )}

            {plot.stage === 'ready' && (
              <group position={[0, 0.22, 0]}>
                <mesh position={[0, 0.38, 0]}>
                  <sphereGeometry args={[0.48, 12, 12]} />
                  <meshToonMaterial color="#15803d" />
                </mesh>
                {[
                  [-0.26, 0.45, 0.26],
                  [0.26, 0.48, 0.25],
                  [0, 0.66, 0.2],
                  [-0.2, 0.56, -0.22],
                  [0.22, 0.42, -0.22],
                ].map(([bx, by, bz], i) => (
                  <mesh key={i} position={[bx, by, bz]}>
                    <sphereGeometry args={[0.14, 10, 10]} />
                    <meshStandardMaterial
                      color="#dc2626"
                      emissive="#ef4444"
                      emissiveIntensity={0.8}
                    />
                  </mesh>
                ))}
              </group>
            )}

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
                  {plot.stage === 'sprout' && '🌿 새싹 (🧹쓸면 즉시 완성)'}
                  {plot.stage === 'growing' && '🌿 영그는 중 (🧹쓸면 즉시 완성)'}
                  {plot.stage === 'ready' && '🫘 붉은 팥 수확! (+2알)'}
                </button>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
};