import { useQuery } from '@tanstack/react-query';
import { HorizonsOrbitalElements } from '@/lib/horizons';
import { FetchError } from '@/lib/utils';

// useHorizonsOrbitalDataFetcherフックのオプションを定義するインターフェース。
interface UseHorizonsOrbitalDataFetcherOptions {
  // 天体のID（例: '399'は地球）。
  bodyId: string;
  // 軌道要素データの取得開始日（YYYY-MM-DD形式）。
  startDate: string;
  // 軌道要素データの取得終了日（YYYY-MM-DD形式）。
  endDate: string;
  // クエリを有効にするかどうか。デフォルトはtrue。
  enabled?: boolean;
}

// useHorizonsOrbitalDataFetcherフックの結果を定義するインターフェース。
interface UseHorizonsOrbitalDataFetcherResult {
  // 取得した軌道要素データの配列、またはデータがない場合はnull。
  data: HorizonsOrbitalElements[] | null;
  isLoading: boolean;
  error: FetchError | null;
}

// Horizons APIから指定された天体の軌道要素データを取得するためのカスタムフック。
// データの取得オプション。
// 軌道要素データ、ロード状態、およびエラーを含むオブジェクトを返します。
export function useHorizonsOrbitalDataFetcher({
  bodyId,
  startDate,
  endDate,
}: UseHorizonsOrbitalDataFetcherOptions): UseHorizonsOrbitalDataFetcherResult {
  const { data, isLoading, isError, error } = useQuery<HorizonsOrbitalElements[], FetchError>(
    {
      queryKey: ['horizons-orbital-data', bodyId, startDate, endDate],
      queryFn: async () => {
        // bodyId, startDate, endDate をURLエンコードして安全に送信
        const encodedBodyId = encodeURIComponent(bodyId);
        const encodedStartDate = encodeURIComponent(startDate);
        const encodedEndDate = encodeURIComponent(endDate);

        const url = `/api/horizons/elements?bodyId=${encodedBodyId}&startDate=${encodedStartDate}&endDate=${encodedEndDate}`;
        const res = await fetch(url);

        if (!res.ok) {
          const errorData = await res.json();
          const fetchError: FetchError = new Error(errorData.error_message || `Failed to fetch orbital data for body ${bodyId}`);
          fetchError.code = res.status;
          throw fetchError;
        }
        const rawData = await res.json();
        console.log('useHorizonsOrbitalDataFetcher - Raw Data from API route:', rawData); // 再度ログを追加
        return rawData;
      },
      staleTime: 24 * 60 * 60 * 1000, // 24時間キャッシュ
      gcTime: 30 * 24 * 60 * 60 * 1000, // 30日後にガベージコレクション
      enabled: !!bodyId && !!startDate && !!endDate, // 全てのパラメータが存在する場合のみクエリを実行
    },
  );

  return {
    data: data || null,
    isLoading,
    error: isError ? error : null,
  };
}
