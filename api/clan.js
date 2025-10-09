// Vercel Serverless Function
// Clash of Clans Clan APIのプロキシエンドポイント
// クラン情報を取得

const { Client } = require('clashofclans.js');

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

    cachedClient = new Client();

    // メールアドレスとパスワードでログイン（自動的にトークンを生成）
    await cachedClient.login({
        email: email,
        password: password
    });

    return cachedClient;
}

module.exports = async function handler(req, res) {
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

    const CLAN_TAGS = process.env.COC_CLAN_TAGS;

    if (!CLAN_TAGS) {
        return res.status(500).json({ error: 'Clan tags not configured' });
    }

    // カンマ区切りのクランタグを配列に変換
    const clanTagArray = CLAN_TAGS.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

    console.log('COC_CLAN_TAGS raw:', CLAN_TAGS);
    console.log('Parsed clan tags:', clanTagArray);

    try {
        const client = await getClient();

        // すべてのクラン情報を並列で取得（エラーハンドリング付き）
        const clanPromises = clanTagArray.map(async (tag) => {
            try {
                // タグに#が含まれていない場合は追加
                const formattedTag = tag.startsWith('#') ? tag : `#${tag}`;
                const clan = await client.getClan(formattedTag);
                return { success: true, clan, tag };
            } catch (error) {
                console.error(`Error fetching clan ${tag}:`, error.message);
                return { success: false, tag, error: error.message };
            }
        });

        const results = await Promise.all(clanPromises);

        // 成功したクランのみを抽出
        const clans = results
            .filter(result => result.success)
            .map(result => result.clan);

        // 失敗したタグをログ出力
        const failedTags = results
            .filter(result => !result.success)
            .map(result => result.tag);

        if (failedTags.length > 0) {
            console.warn('Failed to fetch clans:', failedTags.join(', '));
        }

        // クランレベルで降順ソート
        clans.sort((a, b) => b.clanLevel - a.clanLevel);

        res.status(200).json({
            clans,
            failedTags: failedTags.length > 0 ? failedTags : undefined
        });

    } catch (error) {
        console.error('Error fetching clan data:', error);
        res.status(500).json({
            error: 'Failed to fetch clan data',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
