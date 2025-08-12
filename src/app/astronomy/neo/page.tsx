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
