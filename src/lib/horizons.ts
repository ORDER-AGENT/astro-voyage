export interface HorizonsOrbitalElements {
  epoch: number; // JDTDB (Julian Day Terrestrial Time)
  eccentricity: number; // e (EC)
  perihelionDistance: number; // q (QR) in au
  inclination: number; // i (IN) in degrees
  longitudeOfAscendingNode: number; // Ω (OM) in degrees
  argumentOfPerihelion: number; // ω (W) in degrees
  semiMajorAxis: number; // a (A) in au
  aphelionDistance: number; // Q (AD) in au
  orbitalPeriod: number; // PR (Period) in seconds
  timeOfPeriapsis?: number; // Tp
  meanMotion?: number; // N
  meanAnomaly?: number; // MA
  trueAnomaly?: number; // TA
}

/*
export interface FormattedOrbitalElement {
  name: string;
  title: string;
  value: string;
  units?: string;
  label?: string;
  sigma?: string;
}

export function formatHorizonsElementsForTable(
  elements: HorizonsOrbitalElements
): FormattedOrbitalElement[] {
  const formatted: FormattedOrbitalElement[] = [];

  const n = (v: any) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
  const fmt = (v: any, d = 3) => (n(v) !== undefined ? n(v)!.toFixed(d) : '-');
  const exp = (v: any, d = 8) => (n(v) !== undefined ? n(v)!.toExponential(d) : '-');

  formatted.push({
    name: 'epoch',
    title: 'エポック (JDTDB)',
    value: fmt(elements.epoch, 8),
    label: 'Julian Day Number, Barycentric Dynamical Time',
  });
  formatted.push({
    name: 'eccentricity',
    title: '離心率 (e)',
    value: exp(elements.eccentricity, 8),
    label: 'Eccentricity',
  });
  formatted.push({
    name: 'perihelionDistance',
    title: '近日点距離 (q)',
    value: fmt(elements.perihelionDistance) + ' au',
    label: 'Periapsis distance',
    units: 'au',
  });
  formatted.push({
    name: 'inclination',
    title: '軌道傾斜角 (i)',
    value: fmt(elements.inclination, 6) + ' deg',
    label: 'Inclination w.r.t X-Y plane',
    units: 'degrees',
  });
  formatted.push({
    name: 'longitudeOfAscendingNode',
    title: '昇交点黄経 (Ω)',
    value: fmt(elements.longitudeOfAscendingNode, 6) + ' deg',
    label: 'Longitude of Ascending Node',
    units: 'degrees',
  });
  formatted.push({
    name: 'argumentOfPerihelion',
    title: '近日点引数 (ω)',
    value: fmt(elements.argumentOfPerihelion, 6) + ' deg',
    label: 'Argument of Perifocus',
    units: 'degrees',
  });
  if (elements.timeOfPeriapsis !== undefined) {
    formatted.push({
      name: 'timeOfPeriapsis',
      title: '近日点通過時刻 (Tp)',
      value: fmt(elements.timeOfPeriapsis, 8),
      label: 'Time of periapsis (Julian Day Number)',
    });
  }
  if (elements.meanMotion !== undefined) {
    formatted.push({
      name: 'meanMotion',
      title: '平均運動 (n)',
      value: exp(elements.meanMotion, 8) + ' deg/s',
      label: 'Mean motion',
      units: 'degrees/sec',
    });
  }
  if (elements.meanAnomaly !== undefined) {
    formatted.push({
      name: 'meanAnomaly',
      title: '平均近点角 (MA)',
      value: fmt(elements.meanAnomaly, 6) + ' deg',
      label: 'Mean anomaly',
      units: 'degrees',
    });
  }
  if (elements.trueAnomaly !== undefined) {
    formatted.push({
      name: 'trueAnomaly',
      title: '真近点角 (TA)',
      value: fmt(elements.trueAnomaly, 6) + ' deg',
      label: 'True anomaly',
      units: 'degrees',
    });
  }
  formatted.push({
    name: 'semiMajorAxis',
    title: '軌道長半径 (a)',
    value: fmt(elements.semiMajorAxis) + ' au',
    label: 'Semi-major axis',
    units: 'au',
  });
  formatted.push({
    name: 'aphelionDistance',
    title: '遠日点距離 (Q)',
    value: fmt(elements.aphelionDistance) + ' au',
    label: 'Apoapsis distance',
    units: 'au',
  });
  formatted.push({
    name: 'orbitalPeriod',
    title: '公転周期 (P)',
    value: n(elements.orbitalPeriod) ? (elements.orbitalPeriod! / 86400).toFixed(3) + ' days' : '-',
    label: 'Sidereal orbit period',
    units: 'days',
  });

  return formatted;
}
*/
