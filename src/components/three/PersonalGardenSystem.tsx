import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Sparkles, Float } from '@react-three/drei';
import * as THREE from 'three';
import type { BeanPlot, GardenItemId } from '../../types/wish';
import { getTerrainHeight } from '../../utils/terrain';

// Phase 4: 내 동산에 배치되는 6대 전통 조경 3D 오브제
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
      const s = 0.9 + Math.sin(t * 14) * 0.15;
      fireRef.current.scale.set(s, 1 + Math.cos(t * 12) * 0.2, s);
    }
  });

  return (
    <group>
      {/* 1. 🔥 따뜻한 모닥불 화로 (x: 0, z: 10.2) */}
      {placedDecor.includes('campfire') && (
        <group position={[0, getTerrainHeight(0, 10.2), 10.2]}>
          {/* 돌 테두리 */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const a = (i * Math.PI) / 4;
            return (
              <mesh
                key={i}
                position={[Math.cos(a) * 0.65, 0.12, Math.sin(a) * 0.65]}
                castShadow
              >
                <dodecahedronGeometry args={[0.18, 0]} />
                <meshToonMaterial color="#57534e" />
              </mesh>
            );
          })}
          {/* 장작더미 */}
          <mesh position={[0, 0.15, 0]} rotation={[0, 0.4, Math.PI / 2]}>
            <cylinderGeometry args={[0.1, 0.1, 0.9, 8]} />
            <meshToonMaterial color="#451a03" />
          </mesh>
          <mesh position={[0, 0.15, 0]} rotation={[Math.PI / 2, 0.4, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.9, 8]} />
            <meshToonMaterial color="#451a03" />
          </mesh>
          {/* 타오르는 불꽃 & 온기 조명 */}
          <mesh ref={fireRef} position={[0, 0.45, 0]}>
            <coneGeometry args={[0.38, 0.75, 10]} />
            <meshStandardMaterial
              color="#fb923c"
              emissive="#ea580c"
              emissiveIntensity={2.5}
            />
          </mesh>
          <pointLight
            position={[0, 0.8, 0]}
            color="#fb923c"
            intensity={3}
            distance={8}
          />
          <Sparkles
            count={20}
            scale={1.8}
            position={[0, 0.8, 0]}
            size={4}
            speed={1.5}
            color="#fde047"
          />
        </group>
      )}

      {/* 2. 🌸 천년 겹벚꽃 나무 (x: -6.5, z: 7.2) */}
      {placedDecor.includes('cherry_tree') && (
        <group position={[-6.5, getTerrainHeight(-6.5, 7.2), 7.2]}>
          <mesh position={[0, 1.3, 0]} castShadow>
            <cylinderGeometry args={[0.32, 0.5, 2.6, 12]} />
            <meshToonMaterial color="#4e342e" />
          </mesh>
          <mesh position={[0, 2.9, 0]} castShadow>
            <sphereGeometry args={[1.65, 20, 20]} />
            <meshToonMaterial color="#f48fb1" />
          </mesh>
          <mesh position={[-1.1, 2.5, 0.6]} castShadow>
            <sphereGeometry args={[1.1, 16, 16]} />
            <meshToonMaterial color="#f8bbd0" />
          </mesh>
          <mesh position={[1.1, 2.6, 0.5]} castShadow>
            <sphereGeometry args={[1.15, 16, 16]} />
            <meshToonMaterial color="#f06292" />
          </mesh>
          <Sparkles
            count={35}
            scale={[4.5, 3.5, 4.5]}
            position={[0, 2.2, 0]}
            size={4.5}
            speed={0.6}
            color="#fce4ec"
          />
        </group>
      )}

      {/* 3. 🪨 오층 황금 소원석탑 (x: 6.5, z: 7.2) */}
      {placedDecor.includes('stone_pagoda') && (
        <group position={[6.5, getTerrainHeight(6.5, 7.2), 7.2]}>
          {[0, 1, 2, 3, 4].map((tier) => {
            const w = 1.3 - tier * 0.2;
            const y = 0.25 + tier * 0.45;
            return (
              <group key={tier} position={[0, y, 0]}>
                <mesh castShadow>
                  <boxGeometry args={[w, 0.28, w]} />
                  <meshToonMaterial color="#a8a29e" />
                </mesh>
                <mesh position={[0, 0.18, 0]} castShadow>
                  <coneGeometry args={[w * 0.85, 0.18, 4]} />
                  <meshToonMaterial color="#57534e" />
                </mesh>
              </group>
            );
          })}
          {/* 상륜부 회전 황금 보주 */}
          <mesh ref={pagodaOrbRef} position={[0, 2.55, 0]}>
            <octahedronGeometry args={[0.24, 0]} />
            <meshStandardMaterial
              color="#fef08a"
              emissive="#f59e0b"
              emissiveIntensity={2.5}
            />
          </mesh>
          <Sparkles
            count={16}
            scale={2}
            position={[0, 2.2, 0]}
            size={4}
            color="#fde047"
          />
        </group>
      )}

      {/* 4. 🪵 풍류 대청 평상과 다과상 (x: -5.2, z: 11.2) */}
      {placedDecor.includes('wood_bench') && (
        <group
          position={[-5.2, getTerrainHeight(-5.2, 11.2), 11.2]}
          rotation={[0, 0.4, 0]}
        >
          <mesh position={[0, 0.32, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.5, 0.16, 1.8]} />
            <meshToonMaterial color="#8d6e63" />
          </mesh>
          {[
            [-1.0, 0.16, -0.7],
            [1.0, 0.16, -0.7],
            [-1.0, 0.16, 0.7],
            [1.0, 0.16, 0.7],
          ].map(([lx, ly, lz], i) => (
            <mesh key={i} position={[lx, ly, lz]}>
              <cylinderGeometry args={[0.1, 0.1, 0.32, 8]} />
              <meshToonMaterial color="#4e342e" />
            </mesh>
          ))}
          {/* 평상 위 소반(찻상)과 붉은 팥떡 접시 */}
          <mesh position={[0, 0.48, 0]} castShadow>
            <cylinderGeometry args={[0.45, 0.4, 0.16, 16]} />
            <meshToonMaterial color="#5d4037" />
          </mesh>
          <mesh position={[0, 0.6, 0]}>
            <sphereGeometry args={[0.18, 12, 12]} />
            <meshToonMaterial color="#dc2626" />
          </mesh>
        </group>
      )}

      {/* 5. 🏮 청사초롱 쌍등 (x: 5.2, z: 11.2) */}
      {placedDecor.includes('lantern_pair') && (
        <group
          position={[5.2, getTerrainHeight(5.2, 11.2), 11.2]}
          rotation={[0, -0.4, 0]}
        >
          {[-0.9, 0.9].map((lx, i) => (
            <group key={i} position={[lx, 0, 0]}>
              <mesh position={[0, 1.1, 0]} castShadow>
                <cylinderGeometry args={[0.05, 0.06, 2.2, 8]} />
                <meshToonMaterial color="#4e342e" />
              </mesh>
              <mesh position={[0, 2.1, 0.25]}>
                <boxGeometry args={[0.08, 0.08, 0.6]} />
                <meshToonMaterial color="#4e342e" />
              </mesh>
              {/* 청홍 청사초롱 등불 */}
              <mesh position={[0, 1.82, 0.48]}>
                <cylinderGeometry args={[0.22, 0.22, 0.26, 14]} />
                <meshStandardMaterial
                  color="#dc2626"
                  emissive="#ef4444"
                  emissiveIntensity={1.5}
                />
              </mesh>
              <mesh position={[0, 1.58, 0.48]}>
                <cylinderGeometry args={[0.22, 0.18, 0.26, 14]} />
                <meshStandardMaterial
                  color="#1d4ed8"
                  emissive="#3b82f6"
                  emissiveIntensity={1.5}
                />
              </mesh>
            </group>
          ))}
          <pointLight
            position={[0, 1.8, 0.5]}
            color="#fef08a"
            intensity={2.5}
            distance={7}
          />
        </group>
      )}

      {/* 6. 🎐 액막이 황금 싸리문 (x: 0, z: 14.2) */}
      {placedDecor.includes('ssari_gate') && (
        <group position={[0, getTerrainHeight(0, 14.2), 14.2]}>
          <mesh position={[-1.6, 1.25, 0]} castShadow>
            <cylinderGeometry args={[0.14, 0.18, 2.5, 10]} />
            <meshToonMaterial color="#5d4037" />
          </mesh>
          <mesh position={[1.6, 1.25, 0]} castShadow>
            <cylinderGeometry args={[0.14, 0.18, 2.5, 10]} />
            <meshToonMaterial color="#5d4037" />
          </mesh>
          {/* 지붕 서까래 */}
          <mesh position={[0, 2.45, 0]} castShadow>
            <boxGeometry args={[3.9, 0.25, 0.55]} />
            <meshToonMaterial color="#4e342e" />
          </mesh>
          {/* 액막이 황금 금줄 & 붉은 팥주머니 */}
          <mesh position={[0, 2.1, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.04, 0.04, 3.2, 8]} />
            <meshToonMaterial color="#facc15" />
          </mesh>
          {[-0.8, 0, 0.8].map((px, i) => (
            <mesh key={i} position={[px, 1.92, 0]}>
              <sphereGeometry args={[0.14, 10, 10]} />
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
  const signY = getTerrainHeight(-4.2, 4.5);
  const jarY = getTerrainHeight(4.2, 4.5);

  return (
    <group>
      {/* 내가 배치한 커스텀 조경 오브제 6종 렌더링 */}
      <CustomGardenDecorObjects placedDecor={placedDecor} />

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

      <group position={[4.2, jarY, 4.5]}>
        <mesh position={[0, 0.45, 0]} castShadow>
          <sphereGeometry args={[0.55, 18, 18]} />
          <meshToonMaterial color="#7f1d1d" />
        </mesh>
        <mesh position={[0, 0.9, 0]}>
          <cylinderGeometry args={[0.38, 0.32, 0.18, 16]} />
          <meshToonMaterial color="#450a0a" />
        </mesh>
        <mesh position={[0, 0.98, 0]}>
          <sphereGeometry args={[0.32, 12, 12]} />
          <meshToonMaterial color="#dc2626" />
        </mesh>

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
              <cylinderGeometry args={[1.05, 1.2, 0.22, 20]} />
              <meshToonMaterial color="#4e342e" />
            </mesh>
            <mesh position={[0, 0.17, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.92, 1.06, 20]} />
              <meshBasicMaterial color="#795548" side={2} />
            </mesh>

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

            {plot.stage === 'ready' && (
              <Float speed={3} rotationIntensity={0.05} floatIntensity={0.2}>
                <group position={[0, 0.22, 0]}>
                  <mesh position={[0, 0.38, 0]} castShadow>
                    <sphereGeometry args={[0.48, 16, 16]} />
                    <meshToonMaterial color="#15803d" />
                  </mesh>
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