'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';
import { OrbitalData } from '@/lib/neo';
import * as THREE from 'three';

interface OrbitalViewerProps {
  orbitalData: OrbitalData | null;
}

// 度をラジアンに変換するヘルパー関数
const toRadians = (degrees: number) => degrees * (Math.PI / 180);

// ケプラー軌道要素からデカルト座標を計算する関数
const calculateOrbitalPoints = (orbitalData: OrbitalData): THREE.Vector3[] => {
  const elements = orbitalData.elements;

  // 必要な軌道要素を抽出
  const a = parseFloat(elements.find(e => e.name === 'a')?.value || '1'); // 半長軸 (AU)
  const e = parseFloat(elements.find(e => e.name === 'e')?.value || '0'); // 離心率
  const i = toRadians(parseFloat(elements.find(e => e.name === 'i')?.value || '0')); // 軌道傾斜角 (rad)
  const om = toRadians(parseFloat(elements.find(e => e.name === 'om')?.value || '0')); // 昇交点黄経 (rad)
  const w = toRadians(parseFloat(elements.find(e => e.name === 'w')?.value || '0')); // 近点引数 (rad)

  const points: THREE.Vector3[] = [];
  const numSegments = 200; // 軌道を構成する点の数

  for (let k = 0; k <= numSegments; k++) {
    const E = (k / numSegments) * Math.PI * 2; // 離心近点角 (0から2π)

    // 真近点角を計算 (True Anomaly)
    const nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));

    // 中心天体からの距離を計算
    const r = a * (1 - e * Math.cos(E));

    // 軌道平面内での座標 (x', y')
    const x_prime = r * Math.cos(nu);
    const y_prime = r * Math.sin(nu);
    const z_prime = 0; // 軌道平面なのでzは0

    // 3D空間における座標 (x, y, z) へ変換
    // 昇交点黄経 (om), 近点引数 (w), 軌道傾斜角 (i) を用いた回転
    const x = x_prime * (Math.cos(w) * Math.cos(om) - Math.sin(w) * Math.sin(om) * Math.cos(i))
              - y_prime * (Math.sin(w) * Math.cos(om) + Math.cos(w) * Math.sin(om) * Math.cos(i));
    const y = x_prime * (Math.cos(w) * Math.sin(om) + Math.sin(w) * Math.cos(om) * Math.cos(i))
              + y_prime * (Math.cos(w) * Math.cos(om) - Math.sin(w) * Math.sin(om) * Math.cos(i));
    const z = x_prime * (Math.sin(w) * Math.sin(i))
              + y_prime * (Math.cos(w) * Math.sin(i));

    points.push(new THREE.Vector3(x, z, -y)); // Three.jsの座標系に合わせて調整 (Y-up, Z-forward)
  }

  return points;
};

const OrbitalScene: React.FC<OrbitalViewerProps> = ({ orbitalData }) => {
  const lineRef = useRef<THREE.Line | null>(null);

  useFrame(() => {
    // ここで軌道のアニメーションや更新を行うことができます
  });

  const points = orbitalData ? calculateOrbitalPoints(orbitalData) : [];
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);

  return (
    <>
      {/* 環境光 */}
      <ambientLight intensity={0.5} />
      {/* 太陽の光の代わり */}
      <pointLight position={[0, 0, 0]} intensity={2} /> {/* 光の強度を上げる */}

      {/* 太陽の代わりの球体 */}
      <Sphere args={[0.05, 32, 32]} position={[0, 0, 0]}> {/* サイズを小さくする */}
        <meshBasicMaterial color="yellow" />
      </Sphere>

      {/* 軌道データが与えられた場合にのみ軌道線を描画 */}
      {orbitalData && (
        <line ref={lineRef as any}> {/* ここに as any を追加 */}
          <bufferGeometry attach="geometry" {...lineGeometry} />
          <lineBasicMaterial attach="material" color="white" />
        </line>
      )}
    </>
  );
};

const OrbitalViewer: React.FC<OrbitalViewerProps> = ({ orbitalData }) => {
  return (
    <Canvas
      camera={{ position: [0, 5, 5], fov: 75 }}
      style={{ width: '100%', height: '400px', backgroundColor: '#000' }}
    >
      <OrbitalScene orbitalData={orbitalData} />
      <OrbitControls /> {/* カメラコントロールを追加 */}
    </Canvas>
  );
};

export default OrbitalViewer;
