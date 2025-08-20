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

// earthDateごとのキャッシュ
const photoCache: { [earthDate: string]: MarsRoverPhoto[] } = {};

export const useMarsRoverPhotos = (earthDate: string) => { // pageパラメータを削除
  const [photos, setPhotos] = useState<MarsRoverPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalPhotos, setTotalPhotos] = useState<number | undefined>(undefined);
  // currentPageはフック内で管理せず、呼び出し元で管理する
  
  useEffect(() => {
    const fetchPhotos = async () => {
      setIsLoading(true);
      setError(null);

      // キャッシュにデータがあればそれを使用
      if (photoCache[earthDate]) {
        setPhotos(photoCache[earthDate]);
        setTotalPhotos(photoCache[earthDate].length);
        setIsLoading(false);
        return;
      }

      try {
        // pageパラメータなしでAPIを呼び出す
        const response = await fetch(`/api/mars-rover?earth_date=${earthDate}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: MarsRoverApiResponse = await response.json();
        
        // 取得した全写真をキャッシュに保存
        photoCache[earthDate] = data.photos;

        setPhotos(data.photos);
        setTotalPhotos(data.photos.length); // 全写真の数を設定
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err);
        } else {
          setError(new Error("不明なエラーが発生しました。"));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPhotos();
  }, [earthDate]);

  return { photos, isLoading, error, totalPhotos }; // currentPageを返さない
};
