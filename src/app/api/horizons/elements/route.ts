import { NextResponse } from 'next/server';

/**
 * Horizons APIから天体（小惑星、彗星など）の軌道要素データを取得するAPIルート。
 * NASA JPL Horizonsシステムから特定の天体に関する天文データをフェッチします。
 *
 * @param request Next.jsのAPIリクエストオブジェクト。URLのクエリパラメータからbodyId, startDate, endDateを取得します。
 * @returns 軌道要素データのJSONレスポンス、またはエラーレスポンスを返します。
 */
export async function GET(request: Request) {
  try {
    // リクエストURLから検索パラメータを抽出
    const { searchParams } = new URL(request.url);
    const bodyId = searchParams.get('bodyId');       // 天体ID (例: '2000003' for Earth, '999' for Moon, '2034988' for 1998 QE2)
    const startDate = searchParams.get('startDate'); // 開始日 (YYYY-MM-DD形式)
    const endDate = searchParams.get('endDate');     // 終了日 (YYYY-MM-DD形式)

    // 必須パラメータのバリデーション
    if (!bodyId || !startDate || !endDate) {
      return NextResponse.json(
        { error_message: 'bodyId, startDate, and endDateは必須です。' },
        { status: 400 }
      );
    }

    // Horizons APIリクエスト用のパラメータを設定
    const commandParam = `${bodyId}`; // 天体指定コマンド
    const stepSizeParam = `'1 d'`;    // データ取得間隔 (1日ごと)
    const centerParam = `500@10`;     // 中心天体 (太陽系重心)

    // NASA JPL Horizons APIのURLを構築
    // EPHEM_TYPE=ELEMENTS: 軌道要素データを要求
    // OBJ_DATA=NO: 天体データをレスポンスに含めない
    // MAKE_EPHEM=YES: 軌道暦を作成
    const url = `https://ssd.jpl.nasa.gov/api/horizons.api?format=json&EPHEM_TYPE=ELEMENTS&OBJ_DATA=NO&MAKE_EPHEM=YES&COMMAND=${encodeURIComponent(commandParam)}&START_TIME='${startDate}'&STOP_TIME='${endDate}'&STEP_SIZE=${encodeURIComponent(stepSizeParam)}&CENTER=${encodeURIComponent(centerParam)}`;

    // Horizons APIへのリクエストを送信
    const res = await fetch(url);

    // レスポンスのテキストを取得
    const responseText = await res.text();
    //console.log('Horizons API Raw Response Text (from res.text()):', responseText); // デバッグ用ログ

    // レスポンスがエラー状態（HTTPステータスが2xx以外）の場合の処理
    if (!res.ok) {
      try {
        // エラーレスポンスがJSON形式の場合
        const errorData = JSON.parse(responseText);
        console.error('Horizons APIがエラーで応答しました (Non-OK status):', errorData);
        return NextResponse.json(errorData, { status: res.status });
      } catch (parseError) {
        // エラーレスポンスがJSON形式でない場合
        console.error('Horizons APIが非JSONエラーで応答しました:', responseText);
        return NextResponse.json(
          { error_message: `Horizons APIエラー: ${res.status} ${res.statusText} - ${responseText.substring(0, 200)}...` },
          { status: res.status }
        );
      }
    }

    let data: any;
    try {
      // 成功レスポンスをJSONとしてパース
      data = JSON.parse(responseText);
    } catch (parseError) {
      // JSONパースに失敗した場合
      console.error('Horizons APIレスポンスをJSONとしてパースできませんでした:', parseError, responseText);
      return NextResponse.json(
        { error_message: `Horizons APIレスポンスをJSONとしてパースできませんでした: ${parseError}` },
        { status: 500 }
      );
    }
    
    // 結果テキスト（軌道要素データブロック）を抽出
    const resultText = data.result;
    if (!resultText) {
      // resultがない場合、Horizons APIのエラーメッセージがあればそれを返す
      if (data.message) {
        return NextResponse.json({ error_message: `Horizons APIエラー: ${data.message}` }, { status: 400 });
      }
      // それ以外の場合は一般的なエラーメッセージ
      return NextResponse.json(
        { error_message: 'Horizons APIレスポンスに結果データまたはエラーメッセージが見つかりませんでした。' },
        { status: 500 }
      );
    }
    
    // データブロックを$$SOE (Start Of Ephemeris) と $$EOE (End Of Ephemeris) で区切って抽出
    const lines = resultText.split('\n');
    let soiStart = -1; // $$SOEの開始行
    let soiEnd = -1;   // $$EOEの終了行

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === '$$SOE') {
        soiStart = i;
      } else if (lines[i].trim() === '$$EOE') {
        soiEnd = i;
        break; // $$EOEが見つかったらループを終了
      }
    }

    // データブロックが見つからない場合のエラーハンドリング
    if (soiStart === -1 || soiEnd === -1 || soiStart >= soiEnd) {
      // 特定のエラーメッセージ（例: Astrometric observations are not supported）をチェック
      const horizonsMessageMatch = resultText.match(/Astrometric\s+observations\s+are\s+not\s+supported/);
      if (horizonsMessageMatch) {
          return NextResponse.json({ error_message: `Horizons APIエラー: ${horizonsMessageMatch[0]}` }, { status: 400 });
      }
      return NextResponse.json(
        { error_message: 'Horizons APIレスポンスに軌道要素データブロック ($$SOE - $$EOE) が見つかりませんでした。' },
        { status: 500 }
      );
    }

    // 抽出された生データブロック
    const elementsRawDataBlock = lines.slice(soiStart + 1, soiEnd).join('\n');

    // パースされた軌道要素を格納する配列
    const parsedElements: any[] = [];
    // JDTDB (ユリウス日) で始まる行でデータブロックを個別の要素ブロックに分割
    const elementBlocks = elementsRawDataBlock.split(/(?=^\d{7}\.\d+ = A\.D\.)/gm);

    // Horizons APIのキーとアプリケーションで使用するキーのマッピング
    const keyMapping: { [key: string]: string } = {
      'JDTDB': 'epoch',             // ユリウス日 (テレストリアルダイナミクス時)
      'EC': 'eccentricity',         // 離心率
      'QR': 'perihelionDistance',   // 近日点距離 (AU)
      'IN': 'inclination',          // 軌道傾斜角 (度)
      'OM': 'longitudeOfAscendingNode', // 昇交点経度 (度)
      'W': 'argumentOfPerihelion',  // 近日点引数 (度)
      'A': 'semiMajorAxis',         // 軌道長半径 (AU)
      'AD': 'aphelionDistance',     // 遠日点距離 (AU)
      'PR': 'orbitalPeriod',        // 公転周期 (日)
      'Tp': 'timeOfPeriapsis',      // 近日点通過時刻 (ユリウス日)
      'N': 'meanMotion',            // 平均運動 (度/日)
      'MA': 'meanAnomaly',          // 平均近点角 (度)
      'TA': 'trueAnomaly',          // 真近点角 (度)
    };

    // 各要素ブロックを処理
    for (const block of elementBlocks) {
      if (block.trim() === '') continue; // 空のブロックはスキップ

      const element: { [key: string]: number | string } = {};
      
      // 各行から情報を抽出、空行をフィルタリング
      const blockLines = block.split('\n').map((line: string) => line.trim()).filter(Boolean);

      // 最初の行からJDTDBと日付情報を抽出
      const firstLineMatch = blockLines[0].match(/^(\d+\.\d+) = A\.D\. (.+)$/);
      if (firstLineMatch) {
        element[keyMapping['JDTDB']] = parseFloat(firstLineMatch[1]); // JDTDBをepochにマッピング
        // element['A.D.'] = firstLineMatch[2]; // 日付情報も格納（必要であれば）
      } else {
        console.warn('要素ブロックの不正な最初の行をスキップしました:', blockLines[0]);
        continue;
      }

      // 残りの行からキーと値のペアを抽出
      for (let i = 1; i < blockLines.length; i++) {
        const line = blockLines[i];
        // 正規表現: 各キーと値のペアをより厳密に捕捉し、単位のセクションを削除
        const keyValRegex = /([A-Z]{1,2})\s*=\s*([-+]?\d*\.?\d+(?:[eE][+-]?\d+)?)/g;
        let match;

        while ((match = keyValRegex.exec(line)) !== null) {
          const key = match[1].trim();
          const rawVal = match[2].trim();
          
          if (keyMapping[key]) {
            let parsedValue = parseFloat(rawVal);

            // 単位による変換ロジック
            // 'A', 'AD', 'QR' (軌道長半径, 遠日点距離, 近日点距離) は 'km' から 'au' に変換
            if (['A', 'AD', 'QR'].includes(key)) {
              if (line.includes(' km')) parsedValue = parsedValue / 149597870.7; // 1 AU = 149,597,870.7 km
              // 'au' の場合はそのまま
            }

            // 'PR' (公転周期) は 'days' から秒に変換
            if (key === 'PR' && (line.includes(' days') || line.includes(' day') || line.includes(' d'))) {
              parsedValue = parsedValue * 86400; // 1日 = 86400秒
            }

            element[keyMapping[key]] = parsedValue;
          }
        }
      }
      parsedElements.push(element); // パースされた要素を配列に追加
    }
    
    // パースされた軌道要素データをJSONレスポンスとして返す
    return NextResponse.json(parsedElements);
  } catch (error: any) {
    // 予期せぬエラーが発生した場合の処理
    console.error('Horizons APIルートで予期せぬエラーが発生しました:', error);
    return NextResponse.json(
      { error_message: error.message || '内部サーバーエラーが発生しました。' },
      { status: 500 }
    );
  }
}
