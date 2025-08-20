import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const earth_date = searchParams.get('earth_date');
  const sol = searchParams.get('sol'); // solも取得
  const page = searchParams.get('page');

  const API_KEY = process.env.NASA_API_KEY; // ここでサーバーサイドのみの環境変数を使用
  if (!API_KEY) {
    return NextResponse.json(
      { error_message: 'Server API Key is not defined' },
      { status: 500 }
    );
  }

  let url = `https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos?api_key=${API_KEY}`;

  if (earth_date) {
    url += `&earth_date=${earth_date}`;
  } else if (sol) { // earth_dateがない場合のみsolを使用
    url += `&sol=${sol}`;
  }

  if (page) {
    url += `&page=${page}`;
  }

  console.log('Mars-Rover API Request URL (Before Fetch):', url);
  
  try {
    const res = await fetch(url);

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch Mars Rover photos:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
