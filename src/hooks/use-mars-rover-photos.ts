import { useState, useEffect } from 'react';

interface MarsRoverPhoto {
  id: number;
  img_src: string;
  earth_date: string;
  rover: {
    name: string;
  };
}

interface MarsRoverApiResponse {
  photos: MarsRoverPhoto[];
  total_photos?: number; // APIによっては総写真数を提供する
  sol?: number; // APIによってはsolを提供する
  page?: number; // APIによっては現在のページを提供する
}

export const useMarsRoverPhotos = (earthDate: string, page: number = 1) => {
  const [photos, setPhotos] = useState<MarsRoverPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalPhotos, setTotalPhotos] = useState<number | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState<number>(page);

  useEffect(() => {
    const fetchPhotos = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/mars-rover?earth_date=${earthDate}&page=${page}`); // プロキシされたAPIルート
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: MarsRoverApiResponse = await response.json();
        setPhotos(data.photos);
        setTotalPhotos(data.total_photos); // APIのレスポンスに応じて調整
        setCurrentPage(page);
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPhotos();
  }, [earthDate, page]);

  return { photos, isLoading, error, totalPhotos, currentPage };
};
