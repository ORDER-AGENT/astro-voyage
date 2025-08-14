import { useQuery } from '@tanstack/react-query';
import { OrbitalData } from '@/lib/neo';

interface UseOrbitalDataFetcherOptions {
  neoId: string;
}

interface UseOrbitalDataFetcherResult {
  data: OrbitalData | null;
  isLoading: boolean;
  error: Error | null;
}

export function useOrbitalDataFetcher({
  neoId,
}: UseOrbitalDataFetcherOptions): UseOrbitalDataFetcherResult {
  const { data, isLoading, isError, error } = useQuery<OrbitalData, Error>({
    queryKey: ['orbital-data', neoId],
    queryFn: async () => {
      const url = `/api/neo/orbital-data?neoId=${neoId}`;
      const res = await fetch(url);

      if (!res.ok) {
        const errorData = await res.json();
        const fetchError = new Error(errorData.error_message || 'Failed to fetch orbital data');
        (fetchError as any).code = res.status;
        throw fetchError;
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5分間はデータをfreshとみなす
    gcTime: 10 * 60 * 1000, // 10分後にガベージコレクション
    enabled: !!neoId, // neoIdが存在する場合のみクエリを実行
  });

  return {
    data: data || null,
    isLoading,
    error: isError ? error : null,
  };
}
