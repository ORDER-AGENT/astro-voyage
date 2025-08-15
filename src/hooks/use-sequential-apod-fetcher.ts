// astro-voyage/src/hooks/use-sequential-apod-fetcher.ts
import { useQuery } from '@tanstack/react-query';
import { APOD, getAPOD } from '@/lib/apod';
import { format, subDays } from 'date-fns';
import { useState, useEffect } from 'react';
import { FetchError } from '@/lib/utils'; // 追加

interface UseSequentialApodFetcherOptions {
  startDate?: Date; // 開始日 (デフォルトは今日)
  maxDaysToLookBack?: number; // 何日前まで遡るか (デフォルトは30日)
  numberOfApodsToFetch?: number; // 取得するAPODの数 (デフォルトは1)
}

interface UseSequentialApodFetcherResult {
  data: APOD[]; // 取得したAPODデータの配列
  isLoading: boolean;
  error: FetchError | null; // 型をFetchError | nullに変更
}

export function useSequentialApodFetcher({
  startDate = new Date(),
  maxDaysToLookBack = 30,
  numberOfApodsToFetch = 1, // デフォルト値を1に設定
}: UseSequentialApodFetcherOptions = {}): UseSequentialApodFetcherResult {
  const [currentAttemptDate, setCurrentAttemptDate] = useState(startDate);
  const [attemptsCount, setAttemptsCount] = useState(0); // 試行回数をカウント
  const [successfulDataList, setSuccessfulDataList] = useState<APOD[]>([]); // 成功したデータをリストで保持
  const [lastAttemptError, setLastAttemptError] = useState<Error | null>(null);

  const formattedDate = format(currentAttemptDate, 'yyyy-MM-dd');

  const { data, isLoading, isError, error } = useQuery<APOD, FetchError>({
    queryKey: ['apod', formattedDate],
    queryFn: () => getAPOD(formattedDate),
    enabled: successfulDataList.length < numberOfApodsToFetch && attemptsCount <= maxDaysToLookBack, // 必要な数が揃うまで、かつ試行回数が制限内であればフェッチ
    staleTime: Infinity, // APODデータは特定の日付に対して不変
    gcTime: 24 * 60 * 60 * 1000, // cacheTime を gcTime に変更
    retry: false, // React Queryの自動リトライは行わず、次の日付を試す
  });

  useEffect(() => {
    // 既に必要な数のデータが見つかっているか、試行回数が上限に達している場合は何もしない
    if (successfulDataList.length >= numberOfApodsToFetch || attemptsCount > maxDaysToLookBack) {
      return;
    }

    // クエリがロード中の場合は待機
    if (isLoading) {
      return;
    }

    // クエリが完了した場合の処理
    if (!isLoading) {
      if (isError || !data || data.media_type !== 'image') {
        // 現在のデータ取得が失敗したか、画像データではない場合
        setLastAttemptError(error); // 最後に発生したエラーを記録
        setAttemptsCount(prevCount => prevCount + 1); // 試行回数を増やす

        // 次の候補日を試す (まだ上限に達していない場合)
        if (attemptsCount < maxDaysToLookBack) {
          setCurrentAttemptDate(prevDate => subDays(prevDate, 1)); // 前の日に遡る
        } else {
          // すべての候補日を試したが成功データが見つからなかった場合
          // successfulDataList はそのまま (見つかったものだけ残る)
          setLastAttemptError(new Error(`過去 ${maxDaysToLookBack} 日間、必要な ${numberOfApodsToFetch} 件のAPOD画像が見つかりませんでした。`));
        }
      } else if (data && data.media_type === 'image') {
        // 画像データが正常に取得できた場合
        setSuccessfulDataList(prevList => [...prevList, data]);
        setLastAttemptError(null); // エラーをクリア
        setAttemptsCount(prevCount => prevCount + 1); // 試行回数を増やす（次のデータを探すため）

        // まだ必要な数が揃っていない場合は次の日付へ
        if (successfulDataList.length + 1 < numberOfApodsToFetch) {
            setCurrentAttemptDate(prevDate => subDays(prevDate, 1)); // 次のデータを探すため、日付を遡る
        }
      }
    }
  }, [data, isLoading, isError, error, attemptsCount, maxDaysToLookBack, successfulDataList, numberOfApodsToFetch, currentAttemptDate]);


  return {
    data: successfulDataList,
    isLoading: isLoading || (successfulDataList.length < numberOfApodsToFetch && attemptsCount <= maxDaysToLookBack), // 必要な数が揃っておらず、かつまだ試行中の場合もloading
    error: (successfulDataList.length === 0 && attemptsCount > maxDaysToLookBack) ? lastAttemptError : null, // 成功データが一つも見つからず、試行回数上限に達した場合のみエラーを返す
  };
}