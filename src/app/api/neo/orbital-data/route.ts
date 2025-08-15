import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const neoId = searchParams.get('neoId');

  if (!neoId) {
    return NextResponse.json(
      { error_message: 'neoId is required' },
      { status: 400 }
    );
  }

  const url = `https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=${neoId}`;

  console.log('NeoOrbitalData API Request URL (Before Fetch):', url);

  try {
    const res = await fetch(url);

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(errorData, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data.orbit); // 軌道データ部分のみを返す
  } catch (error: any) {
    console.error('Failed to fetch orbital data from NASA API:', error);
    return NextResponse.json(
      { error_message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
