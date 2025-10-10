// Vercel Serverless Function
// Clash of Clans APIのプロキシエンドポイント
// clashofclans.jsラッパーを使用して動的にトークンを生成

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

    const PLAYER_TAGS = process.env.COC_PLAYER_TAGS;

    if (!PLAYER_TAGS) {
        return res.status(500).json({ error: 'Player tags not configured' });
    }

    // カンマ区切りのプレイヤータグを配列に変換
    const playerTagArray = PLAYER_TAGS.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

    try {
        const client = await getClient();

        // すべてのプレイヤー情報を並列で取得（エラーハンドリング付き）
        const playerPromises = playerTagArray.map(async (tag) => {
            try {
                // タグに#が含まれていない場合は追加
                const formattedTag = tag.startsWith('#') ? tag : `#${tag}`;
                const player = await client.getPlayer(formattedTag);
                return { success: true, player, tag };
            } catch (error) {
                console.error(`Error fetching player ${tag}:`, error.message);
                return { success: false, tag, error: error.message };
            }
        });

        const results = await Promise.all(playerPromises);

        // 成功したプレイヤーのみを抽出
        const players = results
            .filter(result => result.success)
            .map(result => result.player);

        // 失敗したタグをログ出力
        const failedTags = results
            .filter(result => !result.success)
            .map(result => result.tag);

        if (failedTags.length > 0) {
            console.warn('Failed to fetch players:', failedTags.join(', '));
        }

        // タウンホールレベルが高い順、同じ場合は英雄レベル合計順にソート
        players.sort((a, b) => {
            // 타운홀 레벨로 비교
            if (b.townHallLevel !== a.townHallLevel) {
                return b.townHallLevel - a.townHallLevel;
            }

            // 타운홀 레벨이 같은 경우, 영웅 레벨 합계로 비교
            const getTotalHeroLevels = (player) => {
                if (!player.heroes || player.heroes.length === 0) {
                    return 0;
                }
                return player.heroes.reduce((total, hero) => total + hero.level, 0);
            };

            const heroLevelDifference = getTotalHeroLevels(b) - getTotalHeroLevels(a);
            if (heroLevelDifference !== 0) {
                return heroLevelDifference;
            }

            // 영웅 레벨도 같은 경우, 경험치 레벨로 비교
            return b.expLevel - a.expLevel;
        });

        res.status(200).json({
            players,
            failedTags: failedTags.length > 0 ? failedTags : undefined
        });

    } catch (error) {
        console.error('Error fetching player data:', error);
        res.status(500).json({
            error: 'Failed to fetch player data',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
