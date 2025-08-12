import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error_message: 'start_date and end_date are required' },
      { status: 400 }
    );
  }

  const API_KEY = process.env.NASA_API_KEY; // ここでサーバーサイドのみの環境変数を使用
  if (!API_KEY) {
    return NextResponse.json(
      { error_message: 'Server API Key is not defined' },
      { status: 500 }
    );
  }

  const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${startDate}&end_date=${endDate}&api_key=${API_KEY}`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(errorData, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Failed to fetch NEO data from NASA API:', error);
    return NextResponse.json(
      { error_message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
