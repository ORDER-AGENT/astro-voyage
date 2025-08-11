'use client';

import React from 'react';
import ContentLayout from '@/components/ContentLayout';
/*import SalesReportsChart from '@/components/chart/SalesReportsChart';
import AnalyticsDoughnutChart from '@/components/chart/AnalyticsDoughnutChart';
import SimpleCard from '@/components/card/SimpleCard';
import StatisticsCard from '@/components/card/StatisticsCard';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { IoHeart } from 'react-icons/io5';
import { HiBriefcase } from 'react-icons/hi';
import { BsChatDotsFill } from 'react-icons/bs';
import { IoNotifications } from 'react-icons/io5';
*/
export default function Home() {
  return (
    <ContentLayout>
      <div className="p-1 md:p-2 lg:p-4">
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