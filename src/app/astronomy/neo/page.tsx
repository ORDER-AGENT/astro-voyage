'use client';

import React from 'react';
import ContentLayout from '@/components/ContentLayout';
import SimpleCard from '@/components/card/SimpleCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useNeoFetcher } from '@/hooks/use-neo-fetcher';
import { useOrbitalDataFetcher } from '@/hooks/use-orbital-data-fetcher';
import { useHorizonsOrbitalDataFetcher } from '@/hooks/use-horizons-orbital-data-fetcher';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import * as d3 from 'd3';
import { useRef, useEffect, useState } from 'react';
import OrbitalViewer from '@/components/OrbitalViewer';
import { addDays } from 'date-fns';
import { HorizonsOrbitalElements } from '@/lib/horizons';

// NEO (Near Earth Object) ページコンポーネント
export default function NeoPage() {
  // 現在の日付と翌日の日付をY-M-D形式で取得
  const today = new Date();
  const startDate = format(today, 'yyyy-MM-dd');
  const endDate = format(addDays(today, 1), 'yyyy-MM-dd');

  // NEOデータをフェッチ
  const { data: neoDataList, isLoading, error: neoError } = useNeoFetcher({
    startDate: new Date(startDate),
    endDate: new Date(endDate),
  });

  // 取得したNEOデータのうち最初のものを取得
  const firstNeoData = neoDataList.length > 0 ? neoDataList[0] : null;

  // 最初のNEOのIDを使用して軌道データをフェッチ
  const {
    data: orbitalData,
    isLoading: orbitalIsLoading,
    error: orbitalError,
  } = useOrbitalDataFetcher({
    neoId: firstNeoData?.neo_reference_id || '',
  });

  // 太陽系惑星のIDと名前の定義
  const planetIds = [
    { id: '199', name: '水星' },    // Mercury
    { id: '399', name: '地球' },    // Earth
    { id: '299', name: '金星' },    // Venus
    { id: '499', name: '火星' },    // Mars
/*
    { id: '599', name: '木星' },    // Jupiter
    { id: '699', name: '土星' },    // Saturn
    { id: '799', name: '天王星' },  // Uranus
    { id: '899', name: '海王星' },  // Neptune
     */
  ];

  // PlanetDisplayData インターフェース: OrbitalViewer に渡すデータの型定義
  interface PlanetDisplayData {
    id: string;
    name: string;
    elements: HorizonsOrbitalElements[] | null;
    isLoading: boolean;
    error: Error | null;
  }

  // 惑星の軌道データ状態
  const [planetOrbitalData, setPlanetOrbitalData] = useState<PlanetDisplayData[]>(
    planetIds.map(planet => ({ id: planet.id, name: planet.name, elements: null, isLoading: false, error: null }))
  );
  // 現在フェッチ中の惑星のインデックス
  const [currentPlanetIndex, setCurrentPlanetIndex] = useState(0);
  // 全ての惑星のフェッチが完了したかを示すフラグ
  const fetchCompletedRef = useRef(false);

  // 現在の惑星データとHorizons APIからの軌道データフェッチ
  const currentPlanet = planetIds[currentPlanetIndex];
  const { data: fetchedPlanetData, isLoading: isPlanetLoading, error: planetError } = useHorizonsOrbitalDataFetcher({
    bodyId: currentPlanet?.id || '',
    startDate,
    endDate,
    enabled: !!currentPlanet && currentPlanetIndex < planetIds.length && !fetchCompletedRef.current,
  });

  // 惑星軌道データフェッチ完了時の処理
  useEffect(() => {
    if (currentPlanet && !isPlanetLoading && fetchedPlanetData) {
      setPlanetOrbitalData(prevData => {
        const newData = [...prevData];
        newData[currentPlanetIndex] = {
          id: currentPlanet.id,
          name: currentPlanet.name,
          elements: fetchedPlanetData || null,
          isLoading: false,
          error: planetError,
        };
        return newData;
      });

      if (currentPlanetIndex < planetIds.length - 1) {
        setCurrentPlanetIndex(prevIndex => prevIndex + 1);
      } else {
        fetchCompletedRef.current = true; // すべての惑星のフェッチが完了したらフラグを立てる
      }
    }
  }, [fetchedPlanetData, isPlanetLoading, planetError, planetIds, currentPlanet, currentPlanetIndex]);

  // 最初のNEO以外のデータ
  const remainingNeoData = neoDataList.slice(1);

  // D3グラフ描画用のDOM要素への参照とグラフ幅の状態
  const chartRef = useRef(null);
  const [chartWidth, setChartWidth] = useState(0);

  // コンテナ幅に追従させる（サイドバーの開閉やレイアウト変化も検知）
  useEffect(() => {
    const el = chartRef.current as HTMLDivElement | null;
    if (!el) return;

    const calc = () => {
      const styles = window.getComputedStyle(el);
      const pl = parseFloat(styles.paddingLeft) || 0;
      const pr = parseFloat(styles.paddingRight) || 0;
      const contentWidth = el.clientWidth - pl - pr; // パディングを除いた実効幅
      setChartWidth(Math.max(0, contentWidth));
    };

    const ro = new ResizeObserver(() => {
      calc();
    });
    ro.observe(el);

    // 初期レイアウト確定後に一度計測
    const raf = requestAnimationFrame(calc);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [isLoading, firstNeoData]);

  // NEOデータがロードされた後にD3グラフを描画
  useEffect(() => {
    if (!isLoading && neoDataList.length > 0 && chartWidth > 0) {
      const data = neoDataList.map(neo => ({
        name: neo.name,
        diameter: neo.estimated_diameter.kilometers.estimated_diameter_max,
      }));
  
      const margin = { top: 20, right: 30, bottom: 90, left: 60 };
      const width = Math.max(0, chartWidth - margin.left - margin.right);
      const height = 400 - margin.top - margin.bottom;
  
      // 既存のSVG要素を削除
      d3.select(chartRef.current).select("svg").remove();
  
      // SVG要素とグラフ描画グループを作成
      const svg = d3.select(chartRef.current)
        .append("svg")
        .attr("viewBox", `0 0 ${chartWidth} ${height + margin.top + margin.bottom}`)
        .attr("width", "100%")
        .attr("height", "100%")
        .style("display", "block")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
  
      // X軸のスケール設定（小惑星名）
      const x = d3.scaleBand()
        .range([0, width])
        .domain(data.map(d => d.name))
        .padding(0.1);
  
      // Y軸のスケール設定（推定最大直径）
      const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.diameter) || 0])
        .range([height, 0]);
  
      // X軸描画とラベルの傾け表示
      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");
  
      // Y軸描画
      svg.append("g")
        .call(d3.axisLeft(y));
  
      // 棒グラフ描画
      svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.name)!)
        .attr("y", d => y(d.diameter))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.diameter))
        .attr("fill", "steelblue");
  
      // 軸ラベル追加
      svg.append("text")
        .attr("transform", `translate(${width / 2},${height + margin.top + 50})`)
        .style("text-anchor", "middle")
        .text("小惑星名"); // X軸ラベル
  
      // Y軸ラベル
      svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("推定最大直径 (km)"); // Y軸ラベル
    }
  }, [neoDataList, isLoading, chartWidth]);

  return (
    <ContentLayout>
      <div className="p-1 md:p-2 lg:p-4">
        {/* ローディング中のスケルトン表示 */}
        {isLoading ? (
          <SimpleCard title="">
            <Skeleton className="w-full h-48 mt-4" />
            <Skeleton className="w-3/4 h-4 mt-2" />
            <Skeleton className="w-1/2 h-3 mt-1" />
          </SimpleCard>
        ) : (
          <>
            {/* 最初のNEOデータの表示 */}
            {firstNeoData && (
              <SimpleCard
                title={`小惑星名: ${firstNeoData.name}`}
              >
                <p className="text-sm text-gray-600 mt-2">
                  NASA JPL URL:{' '}
                  <a
                    href={firstNeoData.nasa_jpl_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    {firstNeoData.nasa_jpl_url}
                  </a>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  潜在的に危険な小惑星:{' '}
                  {firstNeoData.is_potentially_hazardous_asteroid ? 'はい' : 'いいえ'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  推定直径 (km):{' '}
                  {firstNeoData.estimated_diameter.kilometers.estimated_diameter_min.toFixed(3)} -{' '}
                  {firstNeoData.estimated_diameter.kilometers.estimated_diameter_max.toFixed(3)}
                </p>
                {firstNeoData.close_approach_data.length > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    最接近日時:{' '}
                    {format(
                      new Date(firstNeoData.close_approach_data[0].close_approach_date_full),
                      'yyyy-MM-dd HH:mm:ss'
                    )}{' '}
                    ({firstNeoData.close_approach_data[0].orbiting_body}の周り)
                  </p>
                )}

                {/* 軌道データ表示エリア */}
                <div className="mt-4">
                  <h3 className="text-md font-bold mb-2">軌道データ</h3>
                  {orbitalIsLoading ? (
                    <Skeleton className="w-full h-48 mt-4" />
                  ) : orbitalError ? (
                    <div className="p-4 text-red-500">軌道データの読み込み中にエラーが発生しました: {orbitalError.message}</div>
                  ) : orbitalData ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>要素名</TableHead>
                            <TableHead>値</TableHead>
                            <TableHead>単位</TableHead>
                            <TableHead>説明</TableHead>
                            <TableHead>シグマ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orbitalData.elements.map((element) => (
                            <TableRow key={element.name}>
                              <TableCell className="font-medium">{element.title}</TableCell>
                              <TableCell>{element.value}</TableCell>
                              <TableCell>{element.units || 'N/A'}</TableCell>
                              <TableCell>{element.label}</TableCell>
                              <TableCell>{element.sigma}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="p-4 text-gray-500">軌道データがありません。</div>
                  )}
                </div>

                {/* 軌道ビューワーの表示 */}
                <div className="mt-4">
                  <h2 className="text-lg font-bold mb-2">軌道ビューワー</h2>
                  {orbitalIsLoading || planetOrbitalData.some(p => p.isLoading) ? (
                    <Skeleton className="w-full h-96 mt-4" />
                  ) : orbitalError || planetOrbitalData.some(p => p.error) ? (
                    <div className="p-4 text-red-500">
                      軌道ビューワーの読み込み中にエラーが発生しました:{' '}
                      {orbitalError?.message || planetOrbitalData.map(p => p.error?.message).filter(Boolean).join(', ')}
                    </div>
                  ) : orbitalData || planetOrbitalData.every(p => p.elements && p.elements.length > 0) ? (
                    <OrbitalViewer
                      orbitalData={{ name: firstNeoData.name, data: orbitalData }}
                      planetOrbitalData={planetOrbitalData.map(p => ({
                        id: p.id,
                        name: p.name,
                        elements: p.elements || null
                      }))}
                    />
                  ) : (
                    <div className="p-4 text-gray-500">軌道データを表示できません。</div>
                  )}
                </div>

                {/* D3.js グラフ表示エリア */}
                <div className="mt-4">
                  <h2 className="text-lg font-bold mb-2">小惑星推定最大直径グラフ</h2>
                  <div ref={chartRef} className="bg-white p-4 rounded-lg shadow w-full min-w-0 overflow-x-hidden"></div>
                </div>

                {/* 惑星軌道データ表示エリア (現在コメントアウト中)
                {planetOrbitalData.map((planet) => (
                  <React.Fragment key={planet.id}>
                    {planet.data && planet.data.length > 0 ? (
                      <div className="mt-4">
                        <h3 className="text-md font-bold mb-2">{planet.name}の軌道データ</h3>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>要素名</TableHead>
                                <TableHead>値</TableHead>
                                <TableHead>単位</TableHead>
                                <TableHead>説明</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {formatHorizonsElementsForTable(planet.data[0]).map((element) => (
                                <TableRow key={element.name}>
                                  <TableCell className="font-medium">{element.title}</TableCell>
                                  <TableCell>{element.value}</TableCell>
                                  <TableCell>{element.units || 'N/A'}</TableCell>
                                  <TableCell>{element.label || 'N/A'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 p-4 text-gray-500">
                        {planet.name}の軌道データがありません。
                        {planet.isLoading && 'データを読み込み中...'}
                        {planet.error && `エラーが発生しました: ${planet.error.message}`}
                      </div>
                    )}
                  </React.Fragment>
                ))}*/}

                {/* その他のNEOデータの表示 */}
                {remainingNeoData.length > 0 && (
                  <div className="mt-4">
                    <h2 className="text-lg font-bold mb-2">その他の小惑星</h2>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>名前</TableHead>
                            <TableHead>危険性</TableHead>
                            <TableHead>最小直径 (km)</TableHead>
                            <TableHead>最大直径 (km)</TableHead>
                            <TableHead>最接近日時</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {remainingNeoData.map((neo) => (
                            <TableRow key={neo.id}>
                              <TableCell className="font-medium">{neo.name}</TableCell>
                              <TableCell>
                                {neo.is_potentially_hazardous_asteroid ? '危険' : '安全'}
                              </TableCell>
                              <TableCell>
                                {neo.estimated_diameter.kilometers.estimated_diameter_min.toFixed(3)}
                              </TableCell>
                              <TableCell>
                                {neo.estimated_diameter.kilometers.estimated_diameter_max.toFixed(3)}
                              </TableCell>
                              <TableCell>
                                {neo.close_approach_data.length > 0
                                  ? format(
                                      new Date(neo.close_approach_data[0].close_approach_date_full),
                                      'yyyy-MM-dd HH:mm:ss'
                                    )
                                  : 'N/A'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* NEOデータが存在しない場合、またはエラーの場合のメッセージ */}
                {!firstNeoData && !neoError && (
                  <div className="p-4 text-gray-500">表示できるNEOデータがありません。</div>
                )}

                {neoError && (
                  <div className="p-4 text-red-500">NEOデータの読み込み中にエラーが発生しました: {neoError.message}</div>
                )}
              </SimpleCard>
            )}
          </>
        )}
      </div>
    </ContentLayout>
  );
}
