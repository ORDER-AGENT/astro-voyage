import { FetchError } from '@/lib/utils';

export interface OrbitalElement {
  label: string;
  name: string;
  units: string | null;
  value: string;
  sigma: string;
  title: string;
}

export interface OrbitalData {
  first_obs: string;
  last_obs: string;
  data_arc: string;
  n_obs_used: number;
  rms: string;
  soln_date: string;
  pe_used: string;
  sb_used: string;
  n_del_obs_used: number;
  n_dop_obs_used: number;
  comment: string | null;
  equinox: string;
  condition_code: string;
  t_jup: string;
  cov_epoch: string;
  epoch: string;
  moid: string;
  moid_jup: string;
  elements: OrbitalElement[];
}

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
  //orbital_data: OrbitalData;
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
  const url = `/api/neo?start_date=${startDate}&end_date=${endDate}`;

  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json();
    const error = new Error(errorData.error_message || "Failed to fetch NEO feed");
    (error as FetchError).code = res.status;
    throw error;
  }
  return res.json();
}
