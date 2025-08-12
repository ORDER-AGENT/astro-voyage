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
  const url = date
    ? `/api/apod?date=${date}`
    : `/api/apod`;

  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json();
    const error = new Error(errorData.msg || "Failed to fetch APOD");
    (error as any).code = errorData.code || res.status;
    throw error;
  }
  return res.json();
}
