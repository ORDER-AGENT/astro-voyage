'use client';

import React, { useState } from 'react';
import ContentLayout from '@/components/ContentLayout';
import SimpleCard from '@/components/card/SimpleCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useMarsRoverPhotos } from '@/hooks/use-mars-rover-photos';
import {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination'; // Paginationコンポーネントをインポート
import { Calendar } from "@/components/ui/calendar" // 追加
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover" // 追加
import { Button } from "@/components/ui/button" // 追加
import { cn } from "@/lib/utils" // 追加
import { format } from "date-fns" // 追加
import { CalendarIcon } from "lucide-react" // 追加

export default function MarsRoverPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date()); // 追加
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const formattedDate = oneWeekAgo.toISOString().split('T')[0]; // YYYY-MM-DD形式にフォーマット
  const { photos, isLoading, error, totalPhotos, currentPage: fetchedCurrentPage } = useMarsRoverPhotos(
    selectedDate ? format(selectedDate, "yyyy-MM-dd") : formattedDate, // 変更
    currentPage
  );

  // ページ数を計算する（APIがtotal_photosを提供しない場合は仮の計算）
  const totalPages = totalPhotos ? Math.ceil(totalPhotos / 25) : 50; // 1ページあたり25枚

  console.log('totalPhotos:', totalPhotos);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPaginationItems = () => {
    const pageItems = [];
    const maxPagesToShow = 7; // 表示する最大のページ数（例: 1 2 3 ... 98 99 100）

    if (totalPages <= maxPagesToShow) {
      // 総ページ数が少ない場合は全て表示
      for (let i = 1; i <= totalPages; i++) {
        pageItems.push(
          <PaginationItem key={i}>
            <PaginationLink isActive={i === currentPage} onClick={() => handlePageChange(i)} className="cursor-pointer">
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // 総ページ数が多い場合は省略表示
      const startPages = [1, 2, 3];
      const endPages = [totalPages - 2, totalPages - 1, totalPages];

      // 現在のページの前後のページ
      const middlePages = [];
      for (let i = currentPage - 2; i <= currentPage + 2; i++) {
        if (i > 3 && i < totalPages - 2) {
          middlePages.push(i);
        }
      }

      const allPages = [...new Set([...startPages, ...middlePages, ...endPages])].sort((a, b) => a - b);

      let lastPage = 0;
      allPages.forEach((page) => {
        if (page - lastPage > 1) {
          pageItems.push(
            <PaginationItem key={`ellipsis-${lastPage}`}>
              <PaginationEllipsis />
            </PaginationItem>
          );
        }
        pageItems.push(
          <PaginationItem key={page}>
            <PaginationLink isActive={page === currentPage} onClick={() => handlePageChange(page)} className="cursor-pointer">
              {page}
            </PaginationLink>
          </PaginationItem>
        );
        lastPage = page;
      });
    }
    return pageItems;
  };

  return (
    <ContentLayout>
      <div className="container mx-auto p-4">
        <p className="text-lg mb-4">
          NASAの火星探査機「Curiosity」が撮影した火星の写真を閲覧できます。
          （ページ表示は仮です）
        </p>
        <div className="mb-4">
          {/* 追加開始 */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>日付を選択</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {/* 追加終了 */}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {isLoading ? (
            <>
              {[...Array(4)].map((_, index) => (
                <SimpleCard key={index} title="">
                  <Skeleton className="w-full h-48 mt-4" />
                  <Skeleton className="w-3/4 h-4 mt-2" />
                  <Skeleton className="w-1/2 h-3 mt-1" />
                </SimpleCard>
              ))}
            </>
          ) : error ? (
            <div className="p-4 text-red-500">
              Mars Roverデータの読み込み中にエラーが発生しました: {error?.message}
            </div>
          ) : photos.length > 0 ? (
            <>
              {photos.map((photo) => (
                <SimpleCard key={photo.id} title={`Rover: ${photo.rover.name} - ${photo.earth_date}`}>
                  <img src={photo.img_src} alt={`Mars Rover Photo - ${photo.id}`} className="w-full h-auto rounded-md mt-4" />
                </SimpleCard>
              ))}
            </>
          ) : (
            <div className="p-4 text-gray-500">表示できるMars Roverデータがありません。</div>
          )}
        </div>
        {/* ページネーションUI */}
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} className={currentPage === 1 ? 'cursor-not-allowed opacity-50' : ''} />
            {renderPaginationItems()}
            <PaginationNext onClick={() => handlePageChange(currentPage + 1)} className={currentPage === totalPages ? 'cursor-not-allowed opacity-50' : ''} />
          </PaginationContent>
        </Pagination>
      </div>
    </ContentLayout>
  );
}
