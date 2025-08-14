'use client';

import React from 'react';
import ContentLayout from '@/components/ContentLayout';
import SimpleCard from '@/components/card/SimpleCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useNeoFetcher } from '@/hooks/use-neo-fetcher';
import { useOrbitalDataFetcher } from '@/hooks/use-orbital-data-fetcher'; // 追加
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import * as d3 from 'd3'; // D3.jsライブラリをインポート
import { useRef, useEffect } from 'react'; // Reactのフックをインポート
import OrbitalViewer from '@/components/OrbitalViewer'; // OrbitalViewerコンポーネントをインポート

export default function NeoPage() {
  const today = new Date();
  const startDate = today;
  const endDate = today;

  const { data: neoDataList, isLoading, error: neoError } = useNeoFetcher({
    startDate,
    endDate,
  });

  const firstNeoData = neoDataList.length > 0 ? neoDataList[0] : null;

  // 最初のNEOのIDを使用して軌道データをフェッチ
  const {
    data: orbitalData,
    isLoading: orbitalIsLoading,
    error: orbitalError,
  } = useOrbitalDataFetcher({
    neoId: firstNeoData?.neo_reference_id || '',
  });

  const remainingNeoData = neoDataList.slice(1);

  const chartRef = useRef(null); // D3グラフ描画用のDOM要素への参照を作成

  useEffect(() => {
    // データがロードされ、かつデータが存在する場合のみグラフを描画
    if (!isLoading && neoDataList.length > 0) {
      // グラフ描画用にデータ（小惑星名と推定最大直径）を整形
      const data = neoDataList.map(neo => ({
        name: neo.name,
        diameter: neo.estimated_diameter.kilometers.estimated_diameter_max,
      }));

      // グラフの余白とサイズを設定
      const margin = { top: 20, right: 30, bottom: 90, left: 60 };
      const width = 800 - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom;

      // 既存のSVG要素があれば削除し、新しいグラフを描画するために準備
      d3.select(chartRef.current).select("svg").remove();

      // SVG要素を作成し、グラフを描画するグループ要素を配置
      const svg = d3.select(chartRef.current)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // X軸のスケール（小惑星名）を設定
      const x = d3.scaleBand()
        .range([0, width])
        .domain(data.map(d => d.name))
        .padding(0.1);

      // Y軸のスケール（推定最大直径）を設定
      const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.diameter) || 0])
        .range([height, 0]);

      // X軸を描画し、ラベルを傾けて表示
      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

      // Y軸を描画
      svg.append("g")
        .call(d3.axisLeft(y));

      // 棒グラフを描画
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

      // 軸ラベルの追加
      svg.append("text")
        .attr("transform", `translate(${width / 2},${height + margin.top + 50})`)
        .style("text-anchor", "middle")
        .text("小惑星名"); // X軸ラベル

      svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("推定最大直径 (km)"); // Y軸ラベル
    }
  }, [neoDataList, isLoading]);

  return (
    <ContentLayout>
      <div className="p-1 md:p-2 lg:p-4">
        {isLoading ? (
          <SimpleCard title="">
            <Skeleton className="w-full h-48 mt-4" />
            <Skeleton className="w-3/4 h-4 mt-2" />
            <Skeleton className="w-1/2 h-3 mt-1" />
          </SimpleCard>
        ) : (
          <>
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
                  <h3 className="text-md font-bold mb-2">軌道データ</h3> {/* h2からh3に変更 */}
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

                {/* 軌道ビューアの追加 */}
                <div className="mt-4">
                  <h2 className="text-lg font-bold mb-2">軌道ビューア</h2>
                  {orbitalIsLoading ? (
                    <Skeleton className="w-full h-96 mt-4" />
                  ) : orbitalError ? (
                    <div className="p-4 text-red-500">軌道ビューアの読み込み中にエラーが発生しました: {orbitalError.message}</div>
                  ) : orbitalData ? (
                    <OrbitalViewer orbitalData={orbitalData} />
                  ) : (
                    <div className="p-4 text-gray-500">軌道データを表示できません。</div>
                  )}
                </div>

                {/* D3.js グラフ表示エリア */}
                <div className="mt-4">
                  <h2 className="text-lg font-bold mb-2">小惑星推定最大直径グラフ</h2>
                  <div ref={chartRef} className="bg-white p-4 rounded-lg shadow"></div>
                </div>

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
