'use client';

import React from 'react';
import {
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface AppHeaderProps {
  headerRightContent?: React.ReactNode;
  headerLeftContent?: React.ReactNode;
}

export default function AppHeader({
  headerRightContent,
  headerLeftContent,
}: AppHeaderProps) {
  const shouldShowContent = headerLeftContent || headerRightContent; // SidebarTrigger以外のコンテンツの表示判定

  return (
    <div className="flex items-center justify-between p-4 bg-[#f5f7fd] border-b border-gray-200">
      <div className="flex-1 flex justify-start items-center">
        <SidebarTrigger className="mr-4" /> {/* 無条件で表示 */}
        {shouldShowContent && headerLeftContent} {/* 条件付きで表示 */}
      </div>
      <div className="flex-shrink-0 ml-auto">
        {shouldShowContent && headerRightContent} {/* 条件付きで表示 */}
      </div>
    </div>
  );
}