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
} from '@/components/ui/pagination';
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup, // Add this import
} from "@/components/ui/select" // Add this import for Select component


export default function MarsRoverPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [photosPerPage, setPhotosPerPage] = useState(20); // 1ページあたりの写真数
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const formattedDate = oneWeekAgo.toISOString().split('T')[0]; // YYYY-MM-DD形式にフォーマット

  const { photos, isLoading, error, totalPhotos } = useMarsRoverPhotos( // currentPageを削除
    selectedDate ? format(selectedDate, "yyyy-MM-dd") : formattedDate
  );

  // ページ数を計算
  const totalPages = totalPhotos ? Math.ceil(totalPhotos / photosPerPage) : 0;

  // 現在のページに表示する写真の範囲を計算
  const indexOfLastPhoto = currentPage * photosPerPage;
  const indexOfFirstPhoto = indexOfLastPhoto - photosPerPage;
  const currentPhotos = photos.slice(indexOfFirstPhoto, indexOfLastPhoto);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePhotosPerPageChange = (value: string) => {
    setPhotosPerPage(Number(value));
    setCurrentPage(1); // 表示件数が変わったら1ページ目に戻る
  };

  // ページネーションの表示項目をレンダリングする関数
  const renderPaginationItems = () => {
    const pageItems = [];
    const maxPagesToShow = 7;

    if (totalPages <= maxPagesToShow) {
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
      const startPages = [1, 2, 3]; // 常に表示する最初のページ
      const endPages = [totalPages - 2, totalPages - 1, totalPages]; // 常に表示する最後のページ

      // 現在のページの前後のページ
      const middlePages = [];
      for (let i = currentPage - 2; i <= currentPage + 2; i++) {
        // 中間のページが表示範囲内かつ最初のページと最後のページと重複しないように調整
        if (i > 3 && i < totalPages - 2) {
          middlePages.push(i);
        }
      }

      // 全ての表示対象ページを結合し、重複を排除してソート
      const allPages = [...new Set([...startPages, ...middlePages, ...endPages])].sort((a, b) => a - b);

      let lastPage = 0;
      allPages.forEach((page) => {
        // ページ間にギャップがある場合、省略記号を挿入
        if (page - lastPage > 1) {
          pageItems.push(
            <PaginationItem key={`ellipsis-${lastPage}`}>
              <PaginationEllipsis />
            </PaginationItem>
          );
        }
        // ページリンクを追加
        pageItems.push(
          <PaginationItem key={page}>
            <PaginationLink isActive={page === currentPage} onClick={() => handlePageChange(page)} className="cursor-pointer">
              {page}
            </PaginationLink>
          </PaginationItem>
        );
        lastPage = page; // 最後の表示ページを更新
      });
    }
    return pageItems;
  };

  return (
    <ContentLayout>
      <div className="container mx-auto p-4">
        <p className="text-lg mb-4">
          NASAの火星探査機「Curiosity」が撮影した火星の写真を閲覧できます。
        </p>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 space-y-2 sm:space-y-0 sm:space-x-4">
          {/* 日付選択のポップオーバー */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full sm:w-[240px] justify-start text-left font-normal",
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

          {/* 1ページあたりの表示数選択ドロップダウン */}
          <div className="w-full sm:w-auto">
            <Select onValueChange={handlePhotosPerPageChange} defaultValue={photosPerPage.toString()}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="表示数を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="10">10枚表示</SelectItem>
                  <SelectItem value="20">20枚表示</SelectItem>
                  <SelectItem value="50">50枚表示</SelectItem>
                  <SelectItem value="100">100枚表示</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {isLoading ? (
            <>
              {[...Array(photosPerPage)].map((_, index) => ( // スケルトン表示数もphotosPerPageに合わせる
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
          ) : currentPhotos.length > 0 ? ( // スライスされた写真を表示
            <>
              {currentPhotos.map((photo) => (
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
        { totalPages > 0 && ( // 総ページ数が0より大きい場合のみページネーションを表示
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} className={currentPage === 1 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} />
              {renderPaginationItems()}
              <PaginationNext onClick={() => handlePageChange(currentPage + 1)} className={currentPage === totalPages ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} />
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </ContentLayout>
  );
}
