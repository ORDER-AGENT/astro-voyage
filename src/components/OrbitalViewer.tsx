'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Line, Html } from '@react-three/drei';
import { OrbitalData } from '@/lib/neo';
import { HorizonsOrbitalElements } from '@/lib/horizons';
import { toRadians, AU_IN_KM, propagateMeanAnomaly } from '@/lib/utils';
import * as THREE from 'three';

interface OrbitalViewerProps {
  /** 表示する小惑星の軌道データ */
  orbitalData: { name: string, data: OrbitalData | null };
  /** 表示する惑星の軌道データ (Horizons APIから取得) */
  planetOrbitalData?: { id: string, name: string, elements: HorizonsOrbitalElements[] | null }[];
}

/**
 * 3D点群の簡易統計情報を計算するユーティリティ関数。
 * 主にデバッグや軌道データの検証に使用される。
 * @param points THREE.Vector3の配列
 * @returns 点群の長さ、半径（最小、最大、平均）、バウンディングボックス、サンプル点
 */
const computePointsStats = (points: THREE.Vector3[]) => {
  const n = points.length;
  if (n === 0) return { length: 0 };

  let minX = points[0].x, minY = points[0].y, minZ = points[0].z;
  let maxX = points[0].x, maxY = points[0].y, maxZ = points[0].z;
  let minR = Infinity, maxR = -Infinity, sumR = 0;

  for (let i = 0; i < n; i++) {
    const p = points[i];
    if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
    if (p.z < minZ) minZ = p.z; if (p.z > maxZ) maxZ = p.z;
    const r = Math.hypot(p.x, p.y, p.z); // 原点からの距離（半径）
    if (r < minR) minR = r;
    if (r > maxR) maxR = r;
    sumR += r;
  }

  const pick = (idx: number) => {
    const p = points[idx];
    return { x: +p.x.toFixed(6), y: +p.y.toFixed(6), z: +p.z.toFixed(6) };
  };

  return {
    length: n,
    radius: { min: +minR.toFixed(6), max: +maxR.toFixed(6), mean: +(sumR / n).toFixed(6) },
    bbox: {
      min: { x: +minX.toFixed(6), y: +minY.toFixed(6), z: +minZ.toFixed(6) },
      max: { x: +maxX.toFixed(6), y: +maxY.toFixed(6), z: +maxZ.toFixed(6) },
    },
    sample: [
      pick(0),
      pick(Math.floor(n / 4)),
      pick(Math.floor(n / 2)),
      pick(n - 1),
    ],
  };
};

// ============ 現在位置（エポック時点からの伝播）計算ユーティリティ ============
/**
 * ケプラー方程式を解いて離心近点角Eを計算する。
 * ニュートン法のような反復計算で精度を上げる。
 * @param M 平均近点角 (ラジアン)
 * @param e 離心率
 * @returns 離心近点角 (ラジアン)
 */
const solveEccentricAnomaly = (M: number, e: number) => {
  let E = M; // 初期推定値として平均近点角Mを使用
  for (let iter = 0; iter < 12; iter++) { // 12回の反復で十分な精度が得られる
    E = M + e * Math.sin(E);
  }
  return E;
};

/**
 * 軌道平面内の座標 (x', y') を3D慣性空間の座標 (x, y, z) に変換する。
 * 変換には軌道傾斜角 (i)、昇交点黄経 (om)、近点引数 (w) を使用する。
 * Three.jsの座標系 (Y-up, Z-forward) に合わせて調整される。
 * @param x_prime 軌道平面内のx座標
 * @param y_prime 軌道平面内のy座標
 * @param i 軌道傾斜角 (ラジアン)
 * @param om 昇交点黄経 (ラジアン)
 * @param w 近点引数 (ラジアン)
 * @returns THREE.Vector3形式の慣性空間座標
 */
const rotateToInertialVec = (x_prime: number, y_prime: number, i: number, om: number, w: number) => {
  // 回転行列の適用
  const x = x_prime * (Math.cos(w) * Math.cos(om) - Math.sin(w) * Math.sin(om) * Math.cos(i))
            - y_prime * (Math.sin(w) * Math.cos(om) + Math.cos(w) * Math.sin(om) * Math.cos(i));
  const y = x_prime * (Math.cos(w) * Math.sin(om) + Math.sin(w) * Math.cos(om) * Math.cos(i))
            + y_prime * (Math.cos(w) * Math.cos(om) - Math.sin(w) * Math.sin(om) * Math.cos(i));
  const z = x_prime * (Math.sin(w) * Math.sin(i))
            + y_prime * (Math.cos(w) * Math.sin(i));
  // Three.js座標系に合わせる: Y軸とZ軸を入れ替え、新しいZ軸を反転させる (一般的なY-up, Z-forwardへの変換)
  return new THREE.Vector3(x, z, -y);
};

/**
 * 小惑星の現在の位置を計算する。
 * NEO (Near Earth Object) APIから取得した軌道データを使用し、エポック時点から現在時刻まで平均近点角を伝播させる。
 * @param orbitalData NEOの軌道データ
 * @returns THREE.Vector3形式の現在位置、またはnull（データ不備の場合）
 */
const getAsteroidCurrentPosition = (orbitalData: OrbitalData): THREE.Vector3 | null => {
  const els = orbitalData.elements;
  // 軌道要素のパースとラジアンへの変換
  const a = parseFloat(els.find(e => e.name === 'a')?.value || '0'); // 半長軸 (AU)
  const e = parseFloat(els.find(e => e.name === 'e')?.value || '0'); // 離心率
  const i = toRadians(parseFloat(els.find(e => e.name === 'i')?.value || '0')); // 軌道傾斜角 (ラジアン)
  const om = toRadians(parseFloat(els.find(e => e.name === 'om')?.value || '0')); // 昇交点黄経 (ラジアン)
  const w = toRadians(parseFloat(els.find(e => e.name === 'w')?.value || '0')); // 近点引数 (ラジアン)
  const maDeg = parseFloat(els.find(e => e.name === 'ma')?.value || ''); // エポック時点の平均近点角 (度数)

  const epochJdString = orbitalData.epoch; // エポック日時 (ユリウス日)

  // 必須要素の存在チェックと数値の有効性チェック
  if (!isFinite(a) || !isFinite(e) || !isFinite(i) || !isFinite(om) || !isFinite(w) || !isFinite(maDeg) || !epochJdString) {
    console.warn('getAsteroidCurrentPosition: insufficient elements, skipping sphere');
    return null;
  }

  // 現在時刻を取得し、平均近点角を現在時刻まで伝播させる
  const epochDateString = `${epochJdString} = JD TDB`; // propagateMeanAnomaly関数が期待する形式
  const now = new Date();
  // propagateMeanAnomalyに渡すmaDegはラジアンに変換
  const M = propagateMeanAnomaly(toRadians(maDeg), epochDateString, now, a);

  // 離心近点角Eを計算
  const E = solveEccentricAnomaly(M, e);
  // 軌道平面内でのデカルト座標 (x', y') を計算
  const x_prime = a * (Math.cos(E) - e);
  const y_prime = a * Math.sqrt(Math.max(0, 1 - e * e)) * Math.sin(E);
  // 3D空間の慣性座標系に変換
  const pos = rotateToInertialVec(x_prime, y_prime, i, om, w);
  return pos;
};

/**
 * Horizons APIから取得した軌道要素に基づいて惑星の現在の位置を計算する。
 * 平均近点角または真近点角を現在時刻まで伝播させる。
 * @param elements Horizons APIの軌道要素
 * @returns THREE.Vector3形式の現在位置、またはnull（データ不備の場合）
 */
const getHorizonsCurrentPosition = (elements: HorizonsOrbitalElements): THREE.Vector3 | null => {
  // 半長軸をAUに正規化 (Horizons APIはkmで返す場合があるため)
  let a = elements.semiMajorAxis;
  if (!isFinite(a)) return null;
  if (a > 1e5) a = a / AU_IN_KM; // 非常に大きい値の場合、kmと判断してAUに変換

  // 離心率、軌道傾斜角、昇交点黄経、近点引数を取得しラジアンに変換
  const e = isFinite(elements.eccentricity) ? elements.eccentricity : 0;
  const i = toRadians(isFinite(elements.inclination) ? elements.inclination : 0);
  const om = toRadians(isFinite(elements.longitudeOfAscendingNode) ? elements.longitudeOfAscendingNode : 0);
  const w = toRadians(isFinite(elements.argumentOfPerihelion) ? elements.argumentOfPerihelion : 0);

  let M: number | undefined; // 平均近点角（ラジアン）

  const epochDateString = `${elements.epoch} = JD TDB`; // エポック日時 (ユリウス日)
  const now = new Date(); // 現在時刻

  // 平均近点角 (meanAnomaly) が存在し有効な場合はそれを使用
  if (elements.meanAnomaly !== undefined && isFinite(elements.meanAnomaly)) {
    // 平均近点角（度数）をラジアンに変換し、現在時刻まで伝播
    M = propagateMeanAnomaly(toRadians(elements.meanAnomaly), epochDateString, now, a);
  } else if (elements.trueAnomaly !== undefined && isFinite(elements.trueAnomaly)) {
    // 真近点角 (trueAnomaly) が存在し有効な場合は、真近点角から平均近点角を逆算
    const nu_rad = toRadians(elements.trueAnomaly); // 真近点角をラジアンに変換
    // 真近点角から離心近点角Eを計算
    const E_from_nu = Math.atan2(Math.sqrt(Math.max(0, 1 - e * e)) * Math.sin(nu_rad), Math.cos(nu_rad) - e);
    // 離心近点角Eから平均近点角Mを計算
    M = E_from_nu - e * Math.sin(E_from_nu);
    // エポック時点のMを現在時刻まで伝播
    M = propagateMeanAnomaly(M, epochDateString, now, a);
  }
  
  if (M !== undefined) {
    // 離心近点角Eを計算
    const E = solveEccentricAnomaly(M, e);
    // 軌道平面内でのデカルト座標 (x', y') を計算
    const x_prime = a * (Math.cos(E) - e);
    const y_prime = a * Math.sqrt(Math.max(0, 1 - e * e)) * Math.sin(E);
    // 3D空間の慣性座標系に変換
    const pos = rotateToInertialVec(x_prime, y_prime, i, om, w);
    return pos;
  }
  
  console.warn('getHorizonsCurrentPosition: no TA/MA, skipping sphere');
  return null;
};
// ============================================================

/**
 * ケプラー軌道要素から軌道を構成する点の配列を計算する関数。
 * NEO (Near Earth Object) APIから取得した小惑星の軌道データに使用される。
 * @param orbitalData NEOの軌道データ
 * @returns THREE.Vector3の配列 (軌道上の点)
 */
const calculateOrbitalPoints = (orbitalData: OrbitalData): THREE.Vector3[] => {
  const elements = orbitalData.elements;

  // 必要な軌道要素を抽出し、NaNチェックとデフォルト値の設定
  const a = parseFloat(elements.find(e => e.name === 'a')?.value || '0'); // 半長軸 (AU)
  const validA = isNaN(a) ? 0 : a;
  const e = parseFloat(elements.find(e => e.name === 'e')?.value || '0'); // 離心率
  const validE = isNaN(e) ? 0 : e;
  const i = toRadians(parseFloat(elements.find(e => e.name === 'i')?.value || '0')); // 軌道傾斜角 (ラジアン)
  const validI = isNaN(i) ? 0 : i;
  const om = toRadians(parseFloat(elements.find(e => e.name === 'om')?.value || '0')); // 昇交点黄経 (ラジアン)
  const validOm = isNaN(om) ? 0 : om;
  const w = toRadians(parseFloat(elements.find(e => e.name === 'w')?.value || '0')); // 近点引数 (ラジアン)
  const validW = isNaN(w) ? 0 : w;

  const points: THREE.Vector3[] = [];
  const numSegments = 200; // 軌道を構成する点の数 (解像度)

  for (let k = 0; k <= numSegments; k++) {
    const E = (k / numSegments) * Math.PI * 2; // 離心近点角 (0から2πまで均等に分割)

    // 真近点角を計算 (True Anomaly) - この関数では直接使用しないが、軌道計算の基礎
    // const nu = 2 * Math.atan2(Math.sqrt(Math.max(0, 1 + validE)) * Math.sin(E / 2), Math.sqrt(Math.max(0, 1 - validE)) * Math.cos(E / 2));

    // 中心天体からの距離 (r) を計算 - この関数では直接使用しない
    // const r = validA * (1 - validE * Math.cos(E));

    // 軌道平面内でのデカルト座標 (x', y') を計算
    const x_prime = validA * (Math.cos(E) - validE);
    const y_prime = validA * Math.sqrt(Math.max(0, 1 - validE * validE)) * Math.sin(E);
    // z_primeは軌道平面内なので0
    // const z_prime = 0;

    // 3D空間における座標 (x, y, z) へ変換
    // 昇交点黄経 (om), 近点引数 (w), 軌道傾斜角 (i) を用いた回転行列を適用
    const x = x_prime * (Math.cos(validW) * Math.cos(validOm) - Math.sin(validW) * Math.sin(validOm) * Math.cos(validI))
              - y_prime * (Math.sin(validW) * Math.cos(validOm) + Math.cos(validW) * Math.sin(validOm) * Math.cos(validI));
    const y = x_prime * (Math.cos(validW) * Math.sin(validOm) + Math.sin(validW) * Math.cos(validOm) * Math.cos(validI))
              + y_prime * (Math.cos(validW) * Math.cos(validOm) - Math.sin(validW) * Math.sin(validOm) * Math.cos(validI));
    const z = x_prime * (Math.sin(validW) * Math.sin(validI))
              + y_prime * (Math.cos(validW) * Math.sin(validI));

    // Three.jsの座標系に合わせて調整 (Y-up, Z-forward): y軸とz軸を入れ替え、新しいz軸を反転
    points.push(new THREE.Vector3(x, z, -y));
  }

  return points;
};

/**
 * Horizons APIの軌道要素から軌道を構成する点の配列を計算する関数。
 * HorizonsOrbitalElements は Keplerian elements とは若干異なるため、個別の計算ロジックが必要。
 * @param elements Horizons APIの軌道要素
 * @returns THREE.Vector3の配列 (軌道上の点)
 */
const calculateHorizonsOrbitalPoints = (elements: HorizonsOrbitalElements): THREE.Vector3[] => {
  // semiMajorAxis を AU に正規化（kmで来た場合を検出して変換）
  let a = isNaN(elements.semiMajorAxis) ? 0 : elements.semiMajorAxis;
  if (a > 1e5) { // しきい値: AUなら ~0〜数十、kmなら ~1e6〜1e9 オーダー
    a = a / AU_IN_KM; // km単位であればAUに変換
  }
  // 各軌道要素を取得しラジアンに変換、NaNの場合は0を設定
  const e = isNaN(elements.eccentricity) ? 0 : elements.eccentricity; 
  const i = toRadians(isNaN(elements.inclination) ? 0 : elements.inclination);
  const om = toRadians(isNaN(elements.longitudeOfAscendingNode) ? 0 : elements.longitudeOfAscendingNode);
  const w = toRadians(isNaN(elements.argumentOfPerihelion) ? 0 : elements.argumentOfPerihelion);

  const points: THREE.Vector3[] = [];
  const numSegments = 200; // 軌道を構成する点の数

  // 軌道を離心近点角 (E) ではなく平均近点角 (M) で分割して計算
  for (let k = 0; k <= numSegments; k++) {
    const M = (k / numSegments) * Math.PI * 2; // 平均近点角 (0から2πまで均等に分割)

    // ケプラー方程式を解いて離心近点角Eを求める
    let E = M;
    for (let iter = 0; iter < 10; iter++) {
      E = M + e * Math.sin(E);
    }

    // 真近点角と中心天体からの距離 (r) を計算 - この関数では直接使用しない
    // const nu = 2 * Math.atan2(Math.sqrt(Math.max(0, 1 + e)) * Math.sin(E / 2), Math.sqrt(Math.max(0, 1 - e)) * Math.cos(E / 2));
    // const r = a * (1 - e * Math.cos(E));

    // 軌道平面内でのデカルト座標 (x', y') を計算
    const x_prime = a * (Math.cos(E) - e);
    const y_prime = a * Math.sqrt(Math.max(0, 1 - e * e)) * Math.sin(E);
    // const z_prime = 0; // 軌道平面内なのでzは0

    // 3D空間における座標 (x, y, z) へ変換
    const x = x_prime * (Math.cos(w) * Math.cos(om) - Math.sin(w) * Math.sin(om) * Math.cos(i))
              - y_prime * (Math.sin(w) * Math.cos(om) + Math.cos(w) * Math.sin(om) * Math.cos(i));
    const y = x_prime * (Math.cos(w) * Math.sin(om) + Math.sin(w) * Math.cos(om) * Math.cos(i))
              + y_prime * (Math.cos(w) * Math.cos(om) - Math.sin(w) * Math.sin(om) * Math.cos(i));
    const z = x_prime * (Math.sin(w) * Math.sin(i))
              + y_prime * (Math.cos(w) * Math.sin(i));

    // Three.jsの座標系に合わせて調整 (Y-up, Z-forward): y軸とz軸を入れ替え、新しいz軸を反転
    points.push(new THREE.Vector3(x, z, -y));
  }

  return points;
};

/**
 * 軌道ビューアの3DシーンをレンダリングするReactコンポーネント。
 * 小惑星と惑星の軌道、現在の位置、太陽、グリッドなどを表示する。
 */
const OrbitalScene: React.FC<OrbitalViewerProps> = ({ orbitalData, planetOrbitalData }) => {
  //const lineRef = useRef<THREE.Line | null>(null); // 将来的な軌道アニメーションなどで使用する可能性のあるref

  useFrame(() => {
    // このフック内で、時間経過による軌道上の天体の移動など、フレームごとの更新処理を記述できる。
    // 例: 天体の位置を微調整したり、アニメーションを制御したりする。
  });

  // 小惑星の軌道点を計算し、Three.jsのBufferGeometryに変換
  const asteroidPoints = orbitalData && orbitalData.data ? calculateOrbitalPoints(orbitalData.data) : [];
  const asteroidLineGeometry = new THREE.BufferGeometry().setFromPoints(asteroidPoints); // 現在は直接Lineコンポーネントにpointsを渡すため未使用

  // 小惑星の現在位置を計算
  const asteroidCurrent = orbitalData && orbitalData.data ? getAsteroidCurrentPosition(orbitalData.data) : null;

  // 小惑星の点群統計情報を計算 (デバッグ用)
  const asteroidStats = computePointsStats(asteroidPoints);
  // console.log('ASTEROID points stats:', asteroidStats); // 必要に応じてコメント解除してログ出力

  return (
    <>
      {/* 環境光: シーン全体を均一に照らす */}
      <ambientLight intensity={0.5} />
      {/* ポイントライト: 太陽の位置から光を放射 (太陽の代わり) */}
      <pointLight position={[0, 0, 0]} intensity={3} />

      {/* グリッドヘルパー: 地球の軌道面（XZ平面）に平行なグリッドを表示し、スケール感を視覚的に提供 */}
      <gridHelper args={[20, 200, '#333', '#222']} position={[0, -0.0005, 0]} />

      {/* 太陽の球体とラベル */}
      <Sphere args={[0.1, 32, 32]} position={[0, 0, 0]}>
        <meshBasicMaterial color="yellow" />
      </Sphere>
      <Html position={[0, 0, 0]} className="pointer-events-none">
        <div className="translate-x-2 -translate-y-2">
          <div className="whitespace-nowrap text-[12px] font-bold leading-none text-yellow-300 [writing-mode:horizontal-tb] [text-orientation:mixed] [text-shadow:0_0_3px_rgba(0,0,0,0.9)]">
            太陽
          </div>
        </div>
      </Html>

      {/* 小惑星の軌道線: orbitalDataが存在する場合にのみ描画 */}
      {orbitalData && (
        <Line points={asteroidPoints} color="white" lineWidth={2} />
      )}
      {/* 小惑星の現在位置スフィアとラベル: asteroidCurrentが存在する場合にのみ描画 */}
      {asteroidCurrent && (
        <>
          <Sphere args={[0.03, 16, 16]} position={[asteroidCurrent.x, asteroidCurrent.y, asteroidCurrent.z]}>
            <meshBasicMaterial color="#00ffff" /> {/* シアン色 */}
          </Sphere>
          <Html
            position={[asteroidCurrent.x, asteroidCurrent.y, asteroidCurrent.z]}
            className="pointer-events-none"
          >
            <div className="translate-x-2 -translate-y-2">
              <div className="whitespace-nowrap text-[12px] font-bold leading-none text-cyan-300 [writing-mode:horizontal-tb] [text-orientation:mixed] [text-shadow:0_0_3px_rgba(0,0,0,0.9)]">
                {orbitalData.name} {/* 小惑星名を表示 */}
              </div>
            </div>
          </Html>
        </>
      )}

      {/* 惑星の軌道と現在位置: planetOrbitalDataが存在し、有効な要素がある場合にのみループして描画 */}
      {planetOrbitalData && planetOrbitalData.map((planet, index) => {
        if (planet.elements && planet.elements.length > 0) {
          // Horizons APIのELEMENTS出力は期間内の各ステップの要素を返すため、通常は最初の要素を使用する
          const first = planet.elements[0];
          // 惑星の軌道点を計算
          const planetPoints = calculateHorizonsOrbitalPoints(first);
          if (planetPoints.length === 0) {
            console.warn(`No points calculated for planet ${planet.id}. Check calculateHorizonsOrbitalPoints logic.`);
            return null;
          }
          // 軌道線の色を動的に生成
          const color = new THREE.Color().setHSL(index / planetOrbitalData.length, 1, 0.7);
          const colorHex = `#${color.getHexString()}`;

          // 惑星の現在位置を計算
          const planetCurrent = getHorizonsCurrentPosition(first);

          return (
            <React.Fragment key={planet.id}>
              {/* 惑星の軌道線 */}
              <Line points={planetPoints} color={color} lineWidth={2} />
              {/* 惑星の現在位置スフィアとラベル */}
              {planetCurrent && (
                <>
                  <Sphere args={[0.05, 16, 16]} position={[planetCurrent.x, planetCurrent.y, planetCurrent.z]}>
                    <meshBasicMaterial color={color} />
                  </Sphere>
                  <Html
                    position={[planetCurrent.x, planetCurrent.y, planetCurrent.z]}
                    className="pointer-events-none"
                  >
                    <div className="translate-x-2 -translate-y-2">
                      <div
                        className="whitespace-nowrap text-[12px] font-bold leading-none [writing-mode:horizontal-tb] [text-orientation:mixed]"
                        style={{ color: colorHex, textShadow: '0 0 3px rgba(0,0,0,0.9)' }}
                      >
                        {planet.name} {/* 惑星名を表示 */}
                      </div>
                    </div>
                  </Html>
                </>
              )}
            </React.Fragment>
          );
        }
        return null;
      })}
    </>
  );
};

/**
 * 軌道ビューアのメインコンポーネント。
 * Three.jsのCanvasを設定し、OrbitalSceneコンポーネントを内包する。
 */
const OrbitalViewer: React.FC<OrbitalViewerProps> = ({ orbitalData, planetOrbitalData }) => {
  return (
    <Canvas
      orthographic // 正投影カメラを使用 (遠近感なし)
      camera={{ position: [0, 2, 2], zoom: 120, near: 0.1, far: 10000 }} // カメラ位置、ズーム、クリッピング範囲を設定
      className="w-full bg-black" // 全幅、黒背景
      style={{ height: '400px' }} // 高さ指定
    >
      {/* 3Dシーンのコンポーネントを配置 */}
      <OrbitalScene orbitalData={orbitalData} planetOrbitalData={planetOrbitalData} />
      {/* 軌道制御: マウスでの視点操作を可能にする */}
      <OrbitControls />
    </Canvas>
  );
};

export default OrbitalViewer;