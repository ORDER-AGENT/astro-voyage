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

export default function MarsRoverPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const formattedDate = oneWeekAgo.toISOString().split('T')[0]; // YYYY-MM-DD形式にフォーマット
  const { photos, isLoading, error, totalPhotos, currentPage: fetchedCurrentPage } = useMarsRoverPhotos(formattedDate, currentPage);

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
      <div className="p-1 md:p-2 lg:p-4">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, index) => (
              <SimpleCard key={index} title="">
                <Skeleton className="w-full h-48 mt-4" />
                <Skeleton className="w-3/4 h-4 mt-2" />
                <Skeleton className="w-1/2 h-3 mt-1" />
              </SimpleCard>
            ))} 
          </div>
        ) : error ? (
          <div className="p-4 text-red-500">
            Mars Roverデータの読み込み中にエラーが発生しました: {error?.message}
          </div>
        ) : photos.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <SimpleCard key={photo.id} title={`Rover: ${photo.rover.name} - ${photo.earth_date}`}>
                  <img src={photo.img_src} alt={`Mars Rover Photo - ${photo.id}`} className="w-full h-auto rounded-md mt-4" />
                </SimpleCard>
              ))}
            </div>
            {/* ページネーションUI */}
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} className={currentPage === 1 ? 'cursor-not-allowed opacity-50' : ''} />
                {renderPaginationItems()}
                <PaginationNext onClick={() => handlePageChange(currentPage + 1)} className={currentPage === totalPages ? 'cursor-not-allowed opacity-50' : ''} />
              </PaginationContent>
            </Pagination>
          </>
        ) : (
          <div className="p-4 text-gray-500">表示できるMars Roverデータがありません。</div>
        )}
      </div>
    </ContentLayout>
  );
}
