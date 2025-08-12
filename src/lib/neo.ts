// astro-voyage/src/lib/neo.ts
export interface NearEarthObject {
  links: {
    self: string;
  };
  id: string;
  neo_reference_id: string;
  name: string;
  nasa_jpl_url: string;
  absolute_magnitude_h: number;
  estimated_diameter: {
    kilometers: {
      estimated_diameter_min: number;
      estimated_diameter_max: number;
    };
    meters: {
      estimated_diameter_min: number;
      estimated_diameter_max: number;
    };
    miles: {
      estimated_diameter_min: number;
      estimated_diameter_max: number;
    };
    feet: {
      estimated_diameter_min: number;
      estimated_diameter_max: number;
    };
  };
  is_potentially_hazardous_asteroid: boolean;
  close_approach_data: Array<{
    close_approach_date: string;
    close_approach_date_full: string;
    epoch_date_close_approach: number;
    orbiting_body: string;
    // ... 他のプロパティは必要に応じて追加
  }>;
  orbital_data: {
    // ... 必要に応じて追加
  };
  is_sentry_object: boolean;
}

export interface NearEarthObjectFeed {
  links: {
    next: string;
    prev: string;
    self: string;
  };
  element_count: number;
  near_earth_objects: {
    [date: string]: NearEarthObject[];
  };
}

export async function getNeoFeed(startDate: string, endDate: string): Promise<NearEarthObjectFeed> {
  const API_KEY = process.env.NEXT_PUBLIC_NASA_API_KEY;
  if (!API_KEY) {
    throw new Error("NEXT_PUBLIC_NASA_API_KEY is not defined in .env.local");
  }

  const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${startDate}&end_date=${endDate}&api_key=${API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json();
    const error = new Error(errorData.error_message || "Failed to fetch NEO feed");
    (error as any).code = res.status; // エラーレスポンスにcodeがない場合を考慮
    throw error;
  }
  return res.json();
}
