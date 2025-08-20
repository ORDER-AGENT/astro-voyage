'use client';

import React from 'react';

// ContentLayoutコンポーネントのPropsの型定義
interface ContentLayoutProps {
  children: React.ReactNode;
  isAdmin?: boolean;
  headerRightContent?: React.ReactNode;
  headerLeftContent?: React.ReactNode;
  isHeaderFixed?: boolean; // 新しく追加するプロパティ
}

// ページ全体のレイアウトを提供するコンポーネント
export default function ContentLayout({
  children,
  headerRightContent,
  headerLeftContent, // プロパティとして追加
  isHeaderFixed = false, // デフォルト値をfalseに設定
}: ContentLayoutProps) {
  // headerLeftContentもheaderRightContentも存在しない場合はヘッダーを表示しない
  const shouldShowHeader = headerLeftContent || headerRightContent;
  return (
    <div className="flex-1 flex flex-col bg-[#f5f7fd] min-w-0 h-full">
      {shouldShowHeader && (
        <div className={`flex items-center justify-between px-4 py-4 ${isHeaderFixed ? 'sticky top-[61px] z-10 bg-[#f5f7fd]/80 backdrop-blur-xl' : 'mb-4'}`}>
          <div className="flex-1 flex justify-start items-center">
            {headerLeftContent}
          </div>
          <div className="flex-shrink-0 ml-auto">
            {headerRightContent}
          </div>
        </div>
      )}

      {/* ここからコンテンツ部分 */}
      <div className={`px-4 pb-4 ${shouldShowHeader && isHeaderFixed ? 'pt-0' : 'pt-4'}`}>
        {children}
      </div>
    </div>
  );
}