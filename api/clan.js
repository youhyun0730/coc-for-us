// Vercel Serverless Function
// Clash of Clans Clan API プロキシ
// - /api/clan                  : 여러 클랜 기본 정보(기존 동작)
// - /api/clan/war/current      : 대표 클랜(첫 태그) 현재전
// - /api/clan/war/log          : 대표 클랜 전쟁 로그(비공개면 [])
// - /api/clan/league/group     : 대표 클랜 CWL 그룹
// - /api/clan/league/wars      : 대표 클랜 CWL 전쟁 상세 배열
// - /api/clan/wars/active      : 모든 태그에서 "진행 중" 전쟁(일반+리그) 수집

const { Client } = require('clashofclans.js');

// ------- Cold start対策: client 캐시 -------
let cachedClient = null;

async function getClient() {
  if (cachedClient) return cachedClient;

  const email = process.env.COC_EMAIL;
  const password = process.env.COC_PASSWORD;
  if (!email || !password) {
    throw new Error('COC_EMAIL and COC_PASSWORD must be set in environment variables');
  }

  const client = new Client();
  await client.login({ email, password }); // メール/パスでログイン（トークン自動生成）
  cachedClient = client;
  return cachedClient;
}

// ------- 유틸 -------
function parseClanTags() {
  const CLAN_TAGS = process.env.COC_CLAN_TAGS || '';
  return CLAN_TAGS.split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((t) => (t.startsWith('#') ? t : `#${t}`));
}
function getPrimaryClanTag() {
  const arr = parseClanTags();
  if (!arr.length) throw new Error('Clan tags not configured (COC_CLAN_TAGS)');
  return arr[0];
}
function isActiveWarState(state) {
  return state === 'preparation' || state === 'inWar';
}

module.exports = async function handler(req, res) {
  console.log('Clan API called:', req.method, req.url);

  // --- CORS ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const rawUrl = req.url || '';
  const pathname = rawUrl.split('?')[0]; // 쿼리 제거

  // 환경체크 로그 (기존 스타일 유지)
  const CLAN_TAGS_RAW = process.env.COC_CLAN_TAGS;
  console.log('Environment check:', {
    hasClanTags: !!CLAN_TAGS_RAW,
    hasEmail: !!process.env.COC_EMAIL,
    hasPassword: !!process.env.COC_PASSWORD
  });
  if (!CLAN_TAGS_RAW) {
    return res.status(500).json({ error: 'Clan tags not configured' });
  }
  console.log('COC_CLAN_TAGS raw:', CLAN_TAGS_RAW);
  const parsedTagsNoHash = CLAN_TAGS_RAW.split(',').map((t) => t.trim()).filter(Boolean);
  console.log('Parsed clan tags:', parsedTagsNoHash);

  try {
    const client = await getClient();

    // ===== 1) 먼저: 모든 태그에서 "진행 중 전쟁" 수집 (/api/clan/wars/active) =====
    if (/^\/api\/clan\/wars\/active(?:$|\/)/.test(pathname)) {
      const clanTags = parseClanTags();

      // (a) 일반 클랜전
      const normalWars = await Promise.all(
        clanTags.map(async (tag) => {
          try {
            const w = await client.getClanWar(tag);
            if (w && isActiveWarState(w.state)) {
              return { source: 'normal', clanTag: tag, war: w };
            }
          } catch (e) {
            // notInWar/404/권한 문제 등은 무시
          }
          return null;
        })
      ).then((arr) => arr.filter(Boolean));

      // (b) CWL 전쟁
      const leagueWarTagSet = new Set();
      for (const tag of clanTags) {
        try {
          const group = await client.getClanWarLeagueGroup(tag);
          for (const r of group?.rounds || []) {
            for (const wt of r.warTags || []) {
              if (wt && wt !== '#0') leagueWarTagSet.add(wt);
            }
          }
        } catch (e) {
          // CWL 기간 아님/권한 문제 → 무시
        }
      }

      const leagueWars = await Promise.all(
        [...leagueWarTagSet].map(async (warTag) => {
          try {
            const w = await client.getClanWarLeagueWar(warTag);
            if (!w || !isActiveWarState(w.state)) return null;
            const ourTags = parseClanTags();
            const clansInWar = [w?.clan?.tag, w?.opponent?.tag].filter(Boolean);
            const our = clansInWar.find((t) => ourTags.includes(t));
            return our ? { source: 'league', clanTag: our, war: w } : null;
          } catch (e) {
            return null;
          }
        })
      ).then((arr) => arr.filter(Boolean));

      const activeWars = [...normalWars, ...leagueWars];
      return res.status(200).json({ count: activeWars.length, activeWars });
    }

    // ===== 2) 대표 클랜(첫 태그) 기준: 현재전/로그/CWL 그룹/워즈 =====
    if (/^\/api\/clan\/war\/current(?:$|\/)/.test(pathname)) {
      const tag = getPrimaryClanTag();
      try {
        const war = await client.getClanWar(tag);
        return res.status(200).json(war || null);
      } catch (e) {
        console.warn('getClanWar error:', e?.message);
        return res.status(200).json(null);
      }
    }

    if (/^\/api\/clan\/war\/log(?:$|\/)/.test(pathname)) {
      const tag = getPrimaryClanTag();
      try {
        const log = await client.getClanWarLog(tag);
        const items = Array.isArray(log?.items) ? log.items : [];
        return res.status(200).json(items);
      } catch (e) {
        console.warn('getClanWarLog error (private/unavailable):', e?.message);
        return res.status(200).json([]);
      }
    }

    if (/^\/api\/clan\/league\/group(?:$|\/)/.test(pathname)) {
      const tag = getPrimaryClanTag();
      try {
        const group = await client.getClanWarLeagueGroup(tag);
        return res.status(200).json(group || null);
      } catch (e) {
        console.warn('getClanWarLeagueGroup error:', e?.message);
        return res.status(200).json(null);
      }
    }

    if (/^\/api\/clan\/league\/wars(?:$|\/)/.test(pathname)) {
      const tag = getPrimaryClanTag();
      try {
        const group = await client.getClanWarLeagueGroup(tag);
        if (!group?.rounds?.length) return res.status(200).json([]);

        const warTags = group.rounds.flatMap((r) => r.warTags || []);
        const validTags = warTags.filter((t) => t && t !== '#0');

        const wars = [];
        for (const wTag of validTags) {
          try {
            const w = await client.getClanWarLeagueWar(wTag);
            if (w) wars.push(w);
          } catch (e) {
            console.warn('getClanWarLeagueWar error for', wTag, e?.message);
          }
        }
        return res.status(200).json(wars);
      } catch (e) {
        console.warn('league wars aggregation error:', e?.message);
        return res.status(200).json([]);
      }
    }

    // ===== 3) 마지막: 일반 /api/clan (여러 태그 병렬 조회 — 기존 동작 유지) =====
    if (/^\/api\/clan(?:$|\/|\?)/.test(pathname)) {
      const clanTagArray = (CLAN_TAGS_RAW || '')
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const clanPromises = clanTagArray.map(async (tag) => {
        try {
          const formattedTag = tag.startsWith('#') ? tag : `#${tag}`;
          const clan = await client.getClan(formattedTag);
          return { success: true, clan, tag };
        } catch (error) {
          console.error(`Error fetching clan ${tag}:`, error.message);
          return { success: false, tag, error: error.message };
        }
      });

      const results = await Promise.all(clanPromises);
      const clans = results.filter((r) => r.success).map((r) => r.clan);
      const failedTags = results.filter((r) => !r.success).map((r) => r.tag);

      if (failedTags.length > 0) {
        console.warn('Failed to fetch clans:', failedTags.join(', '));
      }

      return res.status(200).json({
        clans,
        failedTags: failedTags.length > 0 ? failedTags : undefined
      });
    }

    // 매칭 없음
    return res.status(404).json({ error: 'Unknown /api/clan route' });
  } catch (error) {
    console.error('Error in clan api handler:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      error: 'Failed to fetch clan data',
      message: error.message,
      errorName: error.name,
      clanTagsProvided: !!process.env.COC_CLAN_TAGS,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
