import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  const API_KEY = process.env.NASA_API_KEY; // ここでサーバーサイドのみの環境変数を使用
  if (!API_KEY) {
    return NextResponse.json(
      { error_message: 'Server API Key is not defined' },
      { status: 500 }
    );
  }

  const url = date
    ? `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&date=${date}`
    : `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(errorData, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Failed to fetch APOD data from NASA API:', error);
    return NextResponse.json(
      { error_message: (error instanceof Error) ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
