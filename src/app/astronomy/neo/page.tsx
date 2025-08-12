'use client';

import React from 'react';
import ContentLayout from '@/components/ContentLayout';
import SimpleCard from '@/components/card/SimpleCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useNeoFetcher } from '@/hooks/use-neo-fetcher';
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
import { useRef, useEffect } from 'react';

export default function NeoPage() {
  const today = new Date();
  const startDate = today;
  const endDate = today;

  const { data: neoDataList, isLoading, error: neoError } = useNeoFetcher({
    startDate,
    endDate,
  });

  const firstNeoData = neoDataList.length > 0 ? neoDataList[0] : null;
  const remainingNeoData = neoDataList.slice(1);

  const chartRef = useRef(null); // D3グラフ描画用の参照

  useEffect(() => {
    if (!isLoading && neoDataList.length > 0) {
      const data = neoDataList.map(neo => ({
        name: neo.name,
        diameter: neo.estimated_diameter.kilometers.estimated_diameter_max,
      }));

      const margin = { top: 20, right: 30, bottom: 90, left: 60 };
      const width = 800 - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom;

      d3.select(chartRef.current).select("svg").remove(); // 既存のSVGをクリア

      const svg = d3.select(chartRef.current)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      const x = d3.scaleBand()
        .range([0, width])
        .domain(data.map(d => d.name))
        .padding(0.1);

      const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.diameter) || 0])
        .range([height, 0]);

      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

      svg.append("g")
        .call(d3.axisLeft(y));

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

      // 軸ラベル
      svg.append("text")
        .attr("transform", `translate(${width / 2},${height + margin.top + 50})`)
        .style("text-anchor", "middle")
        .text("小惑星名");

      svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("推定最大直径 (km)");
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
              </SimpleCard>
            )}

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
          </>
        )}
      </div>
    </ContentLayout>
  );
}
