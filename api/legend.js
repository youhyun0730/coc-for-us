const { Client } = require('clashofclans.js');

// 클라이언트 캐싱 (콜드 스타트 방지)
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

    // 이메일과 비밀번호로 로그인 (자동으로 토큰 생성)
    await cachedClient.login({
        email: email,
        password: password
    });

    return cachedClient;
}

module.exports = async function handler(req, res) {
    console.log('Legend League API called');

    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONS 요청 (프리플라이트 요청) 처리
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const LEGEND_TAGS = process.env.COC_LEGEND_TAGS;

    if (!LEGEND_TAGS) {
        console.error('Legend tags not configured in environment variables');
        return res.status(500).json({ error: 'Legend tags not configured' });
    }

    // 콤마로 구분된 태그를 배열로 변환
    const legendTagArray = LEGEND_TAGS.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

    if (legendTagArray.length === 0) {
        console.error('No valid legend tags found in environment variables');
        return res.status(400).json({ error: 'No valid legend tags provided' });
    }

    try {
        const client = await getClient();

        // 모든 전설 리그 정보를 병렬로 가져오기 (에러 핸들링 포함)
        const legendPromises = legendTagArray.map(async (tag) => {
            try {
                // 태그에 #가 없으면 추가
                const formattedTag = tag.startsWith('#') ? tag : `#${tag}`;
                const legendPlayer = await client.getPlayer(formattedTag); // 플레이어 정보 가져오기
                return { success: true, legendPlayer, tag };
            } catch (error) {
                console.error(`Error fetching legend player ${tag}:`, error.message);
                return { success: false, tag, error: error.message };
            }
        });

        const results = await Promise.all(legendPromises);

        // 성공한 전설 리그 플레이어만 추출
        const legendPlayers = results
            .filter(result => result.success)
            .map(result => result.legendPlayer);

        // 실패한 태그를 로그 출력
        const failedTags = results
            .filter(result => !result.success)
            .map(result => result.tag);

        if (failedTags.length > 0) {
            console.warn('Failed to fetch legend players:', failedTags.join(', '));
        }

        // 트로피 순으로 내림차순 정렬
        legendPlayers.sort((a, b) => b.trophies - a.trophies);

        res.status(200).json({
            legendPlayers,
            failedTags: failedTags.length > 0 ? failedTags : undefined
        });

    } catch (error) {
        console.error('Error fetching legend league data:', error);
        res.status(500).json({
            error: 'Failed to fetch legend league data',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};