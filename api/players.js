// Vercel Serverless Function
// Clash of Clans APIのプロキシエンドポイント
// clash-of-clans-apiラッパーを使用して動的にトークンを生成

import { Client } from 'clash-of-clans-api';

// クライアントのキャッシュ（コールドスタート対策）
let cachedClient = null;

async function getClient() {
    if (cachedClient) {
        return cachedClient;
    }

    const email = process.env.COC_EMAIL;
    const password = process.env.COC_PASSWORD;

    if (!email || !password) {
        throw new Error('COC_EMAIL and COC_PASSWORD must be set in environment variables');
    }

    cachedClient = new Client({
        keys: [process.env.COC_API_KEY].filter(Boolean),
        email: email,
        password: password
    });

    await cachedClient.login();
    return cachedClient;
}

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

    const PLAYER_TAGS = process.env.COC_PLAYER_TAGS;

    if (!PLAYER_TAGS) {
        return res.status(500).json({ error: 'Player tags not configured' });
    }

    // カンマ区切りのプレイヤータグを配列に変換
    const playerTagArray = PLAYER_TAGS.split(',').map(tag => tag.trim());

    try {
        const client = await getClient();

        // すべてのプレイヤー情報を並列で取得
        const playerPromises = playerTagArray.map(async (tag) => {
            // タグに#が含まれていない場合は追加
            const formattedTag = tag.startsWith('#') ? tag : `#${tag}`;
            const player = await client.getPlayer(formattedTag);
            return player;
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
