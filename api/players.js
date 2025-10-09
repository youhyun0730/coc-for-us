// Vercel Serverless Function
// Clash of Clans APIのプロキシエンドポイント

export default async function handler(req, res) {
    // CORSヘッダー設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONSリクエスト（プリフライト）への対応
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 環境変数からAPIキーとプレイヤータグを取得
    const API_KEY = process.env.COC_API_KEY;
    const PLAYER_TAGS = process.env.COC_PLAYER_TAGS;

    if (!API_KEY) {
        return res.status(500).json({ error: 'API key not configured' });
    }

    if (!PLAYER_TAGS) {
        return res.status(500).json({ error: 'Player tags not configured' });
    }

    // カンマ区切りのプレイヤータグを配列に変換
    const playerTagArray = PLAYER_TAGS.split(',').map(tag => tag.trim());

    try {
        // すべてのプレイヤー情報を並列で取得
        const playerPromises = playerTagArray.map(async (tag) => {
            const url = `https://api.clashofclans.com/v1/players/%23${encodeURIComponent(tag)}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch player ${tag}: ${response.status}`);
            }

            return await response.json();
        });

        const players = await Promise.all(playerPromises);

        // トロフィー数で降順ソート
        players.sort((a, b) => b.trophies - a.trophies);

        res.status(200).json({ players });

    } catch (error) {
        console.error('Error fetching player data:', error);
        res.status(500).json({
            error: 'Failed to fetch player data',
            message: error.message
        });
    }
}
