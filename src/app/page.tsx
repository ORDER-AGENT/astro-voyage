'use client';

import React from 'react';
import ContentLayout from '@/components/ContentLayout';
import SimpleCard from '@/components/card/SimpleCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useSequentialApodFetcher } from '@/hooks/use-sequential-apod-fetcher';

export default function Home() {
  // 新しいカスタムフックを使用
  const { data: apodDataList, isLoading, error: apodError } = useSequentialApodFetcher({
    numberOfApodsToFetch: 1, // 1日分の有効なデータを取得
  });

  // 取得したデータリストの最初の要素を使用
  const apodData = apodDataList.length > 0 ? apodDataList[0] : null;

  // 表示するデータは apodData のみを使用
  const displayApodData = apodData && apodData.media_type === 'image' && !((apodError as any)?.code === 400);

  return (
    <ContentLayout>
      <div className="p-1 md:p-2 lg:p-4">
        {/* isLoading が true の場合はスケルトンを表示 */}
        {isLoading ? (
          <SimpleCard title="">
            <Skeleton className="w-full h-48 mt-4" />
            <Skeleton className="w-3/4 h-4 mt-2" />
            <Skeleton className="w-1/2 h-3 mt-1" />
          </SimpleCard>
        ) : (
          // isLoading が false の場合は、既存のデータ表示ロジックを実行
          displayApodData ? (
            <SimpleCard
              title={`(${apodData.date}): ${apodData.title}`}
            >
              <img src={apodData.url} alt={apodData.title} className="w-full h-auto rounded-md mt-4" />
              <p className="text-sm text-gray-600 mt-2">{apodData.explanation}</p>
              {apodData.copyright && <p className="text-xs text-gray-500 mt-1">© {apodData.copyright}</p>}
            </SimpleCard>
          ) : apodError && !((apodError as any)?.code === 400) ? (
            <div className="p-4 text-red-500">APODデータの読み込み中にエラーが発生しました: {apodError.message}</div>
          ) : (
            <div className="p-4 text-gray-500">表示できるAPODデータがありません。</div>
          )
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/*
          <StatisticsCard
            icon={IoHeart}
            value="178+"
            label="Favorites"
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
          />
          <StatisticsCard
            icon={BsChatDotsFill}
            value="20+"
            label="Messages"
            iconBgColor="bg-yellow-100"
            iconColor="text-yellow-600"
          />
          <StatisticsCard
            icon={IoNotifications}
            value="190+"
            label="Notifications"
            iconBgColor="bg-red-100"
            iconColor="text-red-600"
          />
          <StatisticsCard
            icon={HiBriefcase}
            value="12+"
            label="Jobs"
            iconBgColor="bg-purple-100"
            iconColor="text-purple-600"
          />
          */}
        </div>

        {/* Reports and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/*
          <div className="lg:col-span-2">
            <SalesReportsChart
            />
          </div>
          <div>
            <AnalyticsDoughnutChart
            />
          </div>
          */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/*
          <div className="lg:col-span-2">            
            <SimpleCard
              title="最近の注文"
              dropdownItems={[
                <DropdownMenuItem key="orders-1">注文オプションX</DropdownMenuItem>,
                <DropdownMenuItem key="orders-2">注文オプションY</DropdownMenuItem>,
              ]}
            >
              <div className="h-48 flex items-center justify-center border border-dashed rounded mt-4">注文リスト</div>
            </SimpleCard>
          </div>
          <div>
            <SimpleCard
              title="売れ筋商品"
            >
              <div className="h-48 flex items-center justify-center border border-dashed rounded mt-4">商品リスト</div>
            </SimpleCard>
          </div>
          */}
        </div>
      </div>
    </ContentLayout>
  );
}