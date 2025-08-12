import { useQuery } from '@tanstack/react-query';
import { getNeoFeed, NearEarthObjectFeed, NearEarthObject } from '@/lib/neo';
import { format } from 'date-fns';

interface UseNeoFetcherOptions {
  startDate?: Date;
  endDate?: Date;
}

interface UseNeoFetcherResult {
  data: NearEarthObject[];
  isLoading: boolean;
  error: Error | null;
}

export function useNeoFetcher({
  startDate = new Date(),
  endDate = new Date(),
}: UseNeoFetcherOptions = {}): UseNeoFetcherResult {
  const formattedStartDate = format(startDate, 'yyyy-MM-dd');
  const formattedEndDate = format(endDate, 'yyyy-MM-dd');

  const { data, isLoading, isError, error } = useQuery<NearEarthObjectFeed, Error>({
    queryKey: ['neo', formattedStartDate, formattedEndDate],
    queryFn: () => getNeoFeed(formattedStartDate, formattedEndDate),
    staleTime: 5 * 60 * 1000, // 5分間はデータをfreshとみなす
    gcTime: 10 * 60 * 1000, // 10分後にガベージコレクション
  });

  // 取得したデータを日付に関わらず単一の配列にフラット化
  const neoDataList: NearEarthObject[] = data
    ? Object.values(data.near_earth_objects).flat()
    : [];

  return {
    data: neoDataList,
    isLoading,
    error: isError ? error : null,
  };
}
