'use client';

import React, { useState, useEffect, useRef, ReactNode } from 'react';
import SimpleCard from '@/components/card/SimpleCard';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from "@/lib/utils"; // cn ユーティリティをインポート

interface AnimatedLazyImageCardProps {
  title?: string;
  children: ReactNode; // SimpleCardのchildrenとして渡される他の要素（テキストなど）
  imageSrc: string; // 画像の src を明示的に受け取る
  imageAlt: string; // 画像の alt を明示的に受け取る
}

const AnimatedLazyImageCard: React.FC<AnimatedLazyImageCardProps> = ({
  title,
  children,
  imageSrc,
  imageAlt,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [inView, setInView] = useState(false); // Intersection Observerによって設定される（画面内にあるか）
  const [isInitiallyInView, setIsInitiallyInView] = useState(true); // コンポーネントがマウント時に画面内にあるかどうかの初期判定
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // 初めて Intersection Observer がトリガーされた時（マウント直後）
        if (isInitiallyInView) {
          // もしエントリーが画面外であれば、後続のアニメーションを有効にする
          if (!entry.isIntersecting) {
            setIsInitiallyInView(false); // 画面外にいるので、アニメーションを有効にする
          }
          // 画面内にあった場合は isInitiallyInView は true のまま（アニメーションしない）
        }

        setInView(entry.isIntersecting); // 現在のビューポート内状態を更新

        if (entry.isIntersecting) {
          observer.unobserve(entry.target); // 一度画面に入ったら監視を停止
        }
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0, // 0に設定して、少しでも見えたらすぐに判定
      }
    );

    observer.observe(cardRef.current);

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []); // マウント時のみ実行


  // アニメーションクラスを適用するロジック
  useEffect(() => {
    // 最初から画面外にあり (isInitiallyInViewがfalse)、ビューに入り (inViewがtrue)、
    // かつ画像が読み込まれた (isLoadedがtrue) 場合にアニメーションをトリガー
    if (!isInitiallyInView && inView && isLoaded) {
      // requestAnimationFrame を使用して、DOMの更新が描画された後にクラスを適用
      // これにより、ブラウザが初期状態を認識し、トランジションが正しく動作する
      requestAnimationFrame(() => {
        requestAnimationFrame(() => { // 2回ネストすることで確実に描画サイクルを待つ
          if (cardRef.current) {
            cardRef.current.classList.add('is-animated');
          }
        });
      });
    }
  }, [isInitiallyInView, inView, isLoaded]);


  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  // コンテナに適用するクラスを決定
  let containerClasses = '';
  if (isInitiallyInView) {
    // 最初から画面内にある場合、アニメーションしないので final state のクラスを直接適用
    containerClasses = 'card-no-animation';
  } else {
    // 最初は画面外にある場合、アニメーションの準備として初期スタイルを適用するクラスを適用
    containerClasses = 'card-lazy-load-wrapper';
  }

  return (
    <div ref={cardRef} className={cn(containerClasses)}>
      <SimpleCard title={title}>
        {inView ? ( // ビューポートに入ったら画像とスケルトンを表示
          <>
            <img
              src={imageSrc}
              alt={imageAlt}
              className="w-full h-auto rounded-md mt-4"
              onLoad={handleImageLoad}
              style={{ display: isLoaded ? 'block' : 'none' }} // 読み込みが完了するまで非表示
            />
            {!isLoaded && ( // 読み込み中はスケルトンを表示
              <Skeleton className="w-full h-48 mt-4" />
            )}
          </>
        ) : (
          // まだビューポートに入っていない場合はスケルトンのみ表示
          <Skeleton className="w-full h-48 mt-4" />
        )}
        {children}
      </SimpleCard>
    </div>
  );
};

export default AnimatedLazyImageCard;
