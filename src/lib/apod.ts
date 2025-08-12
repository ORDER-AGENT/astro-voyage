export interface APOD {
  date: string;
  explanation: string;
  hdurl: string;
  media_type: 'image' | 'video' | 'other';
  service_version: string;
  title: string;
  url: string;
  thumbnail_url?: string;
  copyright?: string;
}

export async function getAPOD(date?: string): Promise<APOD> {
  const API_KEY = process.env.NEXT_PUBLIC_NASA_API_KEY;
  if (!API_KEY) {
    throw new Error("NEXT_PUBLIC_NASA_API_KEY is not defined in .env.local");
  }

  const url = date 
    ? `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&date=${date}`
    : `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json();
    const error = new Error(errorData.msg || "Failed to fetch APOD");
    (error as any).code = errorData.code || res.status;
    throw error;
  }
  return res.json();
}
