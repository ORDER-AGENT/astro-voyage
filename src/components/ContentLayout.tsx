'use client';

import React from 'react';

// ContentLayoutコンポーネントのPropsの型定義
interface ContentLayoutProps {
  children: React.ReactNode;
  isAdmin?: boolean;
  headerRightContent?: React.ReactNode;
  headerLeftContent?: React.ReactNode;
}

// ページ全体のレイアウトを提供するコンポーネント
export default function ContentLayout({
  children,
  headerRightContent,
  headerLeftContent, // プロパティとして追加
}: ContentLayoutProps) {
  // headerLeftContentもheaderRightContentも存在しない場合はヘッダーを表示しない
  const shouldShowHeader = headerLeftContent || headerRightContent;

  return (
    <div className="flex-1 flex flex-col p-4 overflow-y-auto bg-[#f5f7fd] min-w-0 h-full">
      {shouldShowHeader && ( // 条件付きでヘッダーを表示
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1 flex justify-start items-center"> {/* 左寄せのコンテナ */}
            {headerLeftContent}
          </div>
          <div className="flex-shrink-0 ml-auto"> {/* 右寄せのコンテナ */}
            {headerRightContent}
          </div>
        </div>
      )}
      {children}
    </div>
  );
} 