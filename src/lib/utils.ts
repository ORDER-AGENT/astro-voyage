import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 角度をラジアンに変換
export const toRadians = (degrees: number): number => degrees * (Math.PI / 180);

// ラジアンを角度に変換
export const toDegrees = (radians: number): number => radians * (180 / Math.PI);

// 太陽の重力定数 (GM) - km^3/s^2
// 1.32712440018e11 km^3/s^2 (Standard Gravitational Parameter of the Sun, IAU 2015)
export const GM_SUN = 1.32712440018e11; 

// 天文単位 (AU) をキロメートルに変換
export const AU_IN_KM = 149597870.7; // IAU 2012 resolution B2

/**
 * 平均近点角をエポック日時から指定されたターゲット日時まで伝播する
 * @param meanAnomalyEpochRadians エポック時点での平均近点角（ラジアン）
 * @param epochDateString エポック日時文字列 (例: "2460172.500000000 = JD TDB")
 * @param targetDate 現在のターゲット日時 (Dateオブジェクト)
 * @param semiMajorAxis 半長軸 (AU)
 * @returns 伝播された平均近点角（ラジアン）
 */
export const propagateMeanAnomaly = (
  meanAnomalyEpochRadians: number,
  epochDateString: string,
  targetDate: Date,
  semiMajorAxis: number
): number => {
  // エポック日時をパース
  // "2460172.500000000 = JD TDB" のような形式からJDを抽出
  const jdMatch = epochDateString.match(/(\d+\.\d+)\s*=\s*JD/);
  if (!jdMatch || !jdMatch[1]) {
    console.error("Invalid epoch date format:", epochDateString);
    return meanAnomalyEpochRadians; // パース失敗時は元の値を返す (既にラジアンとして)
  }
  const epochJd = parseFloat(jdMatch[1]);

  // 現在時刻をJDに変換
  // JavaScriptのDateはUNIXエポック（1970-01-01T00:00:00Z）からのミリ秒
  // Julian Date (JD) の基準は紀元前4713年1月1日正午 (グリニッジ標準時)
  // JD 2440587.5 は 1970年1月1日 00:00:00.0 UTC に相当
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const JD_1970_01_01 = 2440587.5; // 1970-01-01 00:00:00 UTC
  const targetJd = JD_1970_01_01 + targetDate.getTime() / MS_PER_DAY;

  // 時間差 (日)
  const dt = targetJd - epochJd; // 日数

  // 公転周期 (P) の計算 (秒)
  // P = 2π * sqrt(a^3 / GM) のケプラーの第三法則から導出される式を使用。
  // a は AU 単位で与えられるため、GM_SUN との整合性を取るためにキロメートルに変換する必要がある。
  // GM_SUN は km^3/s^2 単位。
  const a_km = semiMajorAxis * AU_IN_KM; // 半長軸をキロメートルに変換

  // 重力定数 GM_SUN は km^3/s^2 なので、結果として公転周期は秒単位で得られる。
  const periodSeconds = 2 * Math.PI * Math.sqrt(Math.pow(a_km, 3) / GM_SUN);

  // 公転周期を秒から日に変換
  const periodDays = periodSeconds / (24 * 60 * 60);

  // 平均運動 (Mean Motion) (ラジアン/日) を計算
  const meanMotion = (2 * Math.PI) / periodDays;

  let propagatedMeanAnomaly = meanAnomalyEpochRadians + meanMotion * dt;

  // 0 から 2π の範囲に正規化し、-2π から 0 の負の値も正の値に変換する。
  propagatedMeanAnomaly = propagatedMeanAnomaly % (2 * Math.PI);
  if (propagatedMeanAnomaly < 0) {
    propagatedMeanAnomaly += 2 * Math.PI;
  }
  return propagatedMeanAnomaly;
};
