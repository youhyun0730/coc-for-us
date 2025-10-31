/* war.js — Active wars (CWL + normal), with filters & grouped sections */
(() => {
  const $  = (s, c=document) => c.querySelector(s);
  const $$ = (s, c=document) => [...c.querySelectorAll(s)];

  // -------- Fetch --------
  async function safeFetch(url, init) {
    try {
      const res = await fetch(url, init);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return await res.json();
    } catch (e) {
      console.error('Fetch error:', url, e);
      throw e;
    }
  }

  // -------- Utils --------
  const fmt = (v) => (v ?? 0).toLocaleString();
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const getNow = () => new Date().getTime();

  // 상태 판정
  function getState(w) {
    const state = (w?.state || w?.war?.state || '').toLowerCase();
    return state || 'unknown';
  }

  function formatKoreanDuration(ms){
    if (!isFinite(ms) || ms <= 0) return '';
    const totalSec = Math.floor(ms/1000);
    const totalMin = Math.floor(totalSec/60);
    const hours = Math.floor(totalMin/60);
    const mins = totalMin % 60;
    if (hours > 0) return `${hours}시간${mins>0?` ${mins}분`:''}`;
    return `${mins}분`;
  }

function computeSideStats(side, opponent, attacksPerMember, size){
  const members = Array.isArray(side?.members) ? side.members : [];
  const oppMembers = Array.isArray(opponent?.members) ? opponent.members : [];
  const oppTagSet = new Set(oppMembers.map(m => m?.tag).filter(Boolean));

  const totalPossible = (Number(size)||0) * (Number(attacksPerMember)||0);

  // 사용 공격 수
  let atkCount = 0;

  // 상대 각 방어(=defenderTag)별 최고 파괴율 집계
  const bestByDefender = new Map(); // defenderTag -> best %
  members.forEach(m => {
    const atks = Array.isArray(m?.attacks) ? m.attacks : [];
    atks.forEach(a => {
      // destruction 필드 호환
      const destr = a?.destruction ?? a?.destructionPercentage;
      const defTag = a?.defenderTag;
      if (typeof destr !== 'undefined') {
        atkCount += 1;
        if (defTag && oppTagSet.has(defTag)) {
          const val = Number(destr) || 0;
          const prev = bestByDefender.get(defTag) ?? 0;
          if (val > prev) bestByDefender.set(defTag, val);
        }
      }
    });
  });

  // 총파괴율 = (상대 각 방어의 최고 파괴율 합) / 팀 규모
  const teamSize = Number(size) || 0;
  const sumBest = [...bestByDefender.values()].reduce((s,v) => s + v, 0);
  const totalPct = teamSize ? Math.round((sumBest / teamSize) * 10) / 10 : 0;

  return { used: atkCount, total: totalPossible, totalPct };
}

  function timeLeftKorean(iso){
    if (!iso) return '';
    const ms = new Date(iso).getTime() - getNow();
    if (ms <= 0) return '0분';
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}시간${m>0?` ${m}분`:''}`;
    return `${m}분`;
  }

  function timeLeft(iso) {
    if (!iso) return '';
    const ms = new Date(iso).getTime() - getNow();
    if (ms <= 0) return '0m 0s';
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return `${h}h ${m}m ${ss}s`;
  }

  const thIcon = (lvl) => lvl ? `TH · ⭐ ${lvl}` : '';
  const koState = (s) => {
    const x = String(s||'').toLowerCase();
    if (x === 'preparation') return '준비';
    if (x === 'inwar') return '전쟁 중';
    if (x === 'warended') return '종료';
    return '알수없음';
  };

  // -------- View: Filters / Sections --------
  function renderFilters(root) {
    root.innerHTML = `
      <div class="war-toolbar">
        <div class="filters" role="tablist" aria-label="War filters">
          <button class="filter-btn active" data-filter="all">전체</button>
          <button class="filter-btn" data-filter="league">리그전</button>
          <button class="filter-btn" data-filter="normal">클랜전</button>
        </div>
      </div>
      <section class="group" data-group="preparation">
        <h2>준비 중</h2>
        <div class="cards" id="preparation"></div>
      </section>
      <section class="group" data-group="inWar">
        <h2>진행 중</h2>
        <div class="cards" id="inWar"></div>
      </section>
      <section class="group" data-group="warEnded" style="display:none;">
        <h2>최근 종료</h2>
        <div class="cards" id="warEnded"></div>
      </section>
    `;
  }

  function progress(value, total) {
    const ratio = total > 0 ? value / total : 0;
    const pct = Math.round(clamp01(ratio) * 100);
    return `
      <div class="progress">
        <div class="bar" style="width:${pct}%"></div>
      </div>
    `;
  }

  function warCard(item) {
    const isLeague = (item?.source || '').toLowerCase().includes('league');
    const war = item.war || item;

    const state = (war.state || '').toLowerCase();
    const size  = war?.teamSize ?? 15;
    const apm   = war?.attacksPerMember ?? 2;

    const clan  = war?.clan || {};
    const opp   = war?.opponent || {};
    const endAt = war?.endTime || war?.endTimeUTC || war?.endTimeIso;
    const start = war?.startTime || war?.preparationStartTime || war?.startTimeUTC;

    const statsL = computeSideStats(clan, opp, apm, size);
    const statsR = computeSideStats(opp, clan, apm, size);
    const usedL = statsL.used;
    const usedR = statsR.used;
    const total = statsL.total;
    const totalPctL = statsL.totalPct;
    const totalPctR = statsR.totalPct;

    const leftStars  = fmt(clan?.stars);
    const rightStars = fmt(opp?.stars);

    const timer = state === 'preparation' ? timeLeftKorean(start) : state === 'inwar' ? timeLeftKorean(endAt) : '';

    const el = document.createElement('article');
    el.className = `war-card is-${state} ${isLeague ? 'type-league' : 'type-normal'}`;
    el.__startIso = start || null;
    el.__endIso   = endAt || null;
    el.__state    = state;
    el.innerHTML = `
      <header class="card-head">
        <span class="badge ${isLeague ? 'league' : 'normal'}">${isLeague ? '리그전' : '클랜전'}</span>
        <span class="state">${koState(state)}</span>
        <span class="size">${size}인전</span>
        ${timer ? `<span class="timer">⏱ ${timer}</span>` : ''}
      </header>

      <div class="card-body">
        <div class="side left">
          <div class="name">${clan?.name ?? 'Unknown'} <span class="tag">${clan?.tag ?? ''}</span></div>
          <div class="meta">
            <span class="th">${thIcon(clan?.townHallLevel)}</span>
            <span>⭐ ${leftStars}</span>
            <span class="used-left">⚔️ ${fmt(usedL)} / ${fmt(total)}</span>
            <span class="avg-left">💥 ${totalPctL}%</span>
          </div>
          ${progress(usedL, total)}
        </div>

        <div class="vs">VS</div>

        <div class="side right">
          <div class="name">${opp?.name ?? 'Unknown'} <span class="tag">${opp?.tag ?? ''}</span></div>
          <div class="meta">
            <span class="th">${thIcon(opp?.townHallLevel)}</span>
            <span>⭐ ${rightStars}</span>
            <span class="used-right">⚔️ ${fmt(usedR)} / ${fmt(total)}</span>
            <span class="avg-right">💥 ${totalPctR}%</span>
          </div>
          ${progress(usedR, total)}
        </div>
      </div>
      <div class="card-foot">
        <button class="roster-btn"
          data-clantag="${clan?.tag || ''}"
          data-source="${isLeague ? 'league' : 'normal'}"
          data-wartag="${war?.warTag || ''}">
          명단/공격 보기
        </button>
      </div>
      <div class="roster" hidden></div>      
    `;
    el.__war = war;
    enrichCard(el, war, isLeague);
    return el;
  }

  async function enrichCard(card, war, isLeague) {
    const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    const clanTag = war?.clanTag || war?.clan?.tag;
    const warTag  = war?.warTag || '';

    if (!clanTag) {
      card.querySelector('.roster')?.remove();
      return;
    }

    const encodedTag = encodeURIComponent(clanTag);
    const encodedWarTag = warTag ? `&warTag=${encodeURIComponent(warTag)}` : '';
    const source = isLeague ? 'league' : 'normal';
    
    const detailUrl = isLocal
      ? `/api/clan/wars/detail?clanTag=${encodedTag}&source=${source}${encodedWarTag}`
      : `/api/clan?route=wars_detail&clanTag=${encodedTag}&source=${source}${encodedWarTag}`;

    try {
      const res = await fetch(detailUrl);
      const json = await res.json();
      
      // ✅ data는 json.war 또는 json 자체!
      const data = json?.war || json;
  
      const apm  = Number(data?.attacksPerMember ?? war?.attacksPerMember ?? 2);
      const size = Number(data?.teamSize ?? war?.teamSize ?? 15);
      
      // ✅ data.clan, data.opponent 넘기기!
      const statsL = computeSideStats(data?.clan, data?.opponent, apm, size);
      const statsR = computeSideStats(data?.opponent, data?.clan, apm, size);
  
      const usedL = card.querySelector('.used-left');
      const usedR = card.querySelector('.used-right');
      const avgL  = card.querySelector('.avg-left');
      const avgR  = card.querySelector('.avg-right');
      if (usedL) usedL.textContent = `⚔️ ${statsL.used} / ${statsL.total}`;
      if (usedR) usedR.textContent = `⚔️ ${statsR.used} / ${statsR.total}`;
      if (avgL)  avgL.textContent  = `💥 ${statsL.totalPct}%`;
      if (avgR)  avgR.textContent  = `💥 ${statsR.totalPct}%`;
  
      const state = (data?.state || '').toLowerCase();
      const endAt   = data?.endTime || data?.endTimeUTC || data?.endTimeIso;
      const startAt = data?.startTime || data?.preparationStartTime || data?.startTimeUTC;
      const t = state === 'preparation'
        ? timeLeftKorean(startAt)
        : state === 'inwar'
        ? timeLeftKorean(endAt)
        : '';
  
      const ts = card.querySelector('.timer');
      if (ts) ts.textContent = t ? `⏱ ${t}` : '';
    } catch (e) {
      console.error('enrichCard error', e);
    }
  }  

  function renderData(root, data, currentFilter = 'all') {
    const byId = (id) => $(id.startsWith('#') ? id : `#${id}`, root);
    const contPrep = byId('preparation');
    const contIn   = byId('inWar');
    const contEnd  = byId('warEnded');

    contPrep.innerHTML = '';
    contIn.innerHTML   = '';
    contEnd.innerHTML  = '';

    const list = (data?.activeWars ?? []).filter((it) => {
      if (currentFilter === 'all') return true;
      const src = (it?.source || '').toLowerCase();
      return currentFilter === 'league' ? src.includes('league') : !src.includes('league');
    });

    if (!list.length) {
      contPrep.innerHTML = `<div class="empty">표시할 전쟁이 없습니다.</div>`;
      return;
    }

    list.forEach((it) => {
      const state = getState(it.war || it);
      const card = warCard(it);
      if (state === 'preparation') contPrep.appendChild(card);
      else if (state === 'inwar' || state === 'inWar') contIn.appendChild(card);
      else if (state === 'warended' || state === 'warEnded') {
        document.querySelector('[data-group="warEnded"]').style.display = '';
        contEnd.appendChild(card);
      } else {
        contIn.appendChild(card);
      }
    });

    $$('.group', root).forEach(g => {
      const has = g.querySelector('.cards').children.length > 0;
      g.style.display = has ? '' : 'none';
    });
  }

  function bindFilter(root, data) {
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      $$('.filter-btn', root).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      renderData(root, data, f);
    });
  }

  function startTicker(root) {
    setInterval(() => {
      $$('.war-card .timer', root).forEach((el) => {
        const card = el.closest('.war-card');
        const state = card?.__state || '';
        const endIso = card?.__endIso || '';
        const startIso = card?.__startIso || '';
        const t = state === 'preparation' ? timeLeftKorean(startIso) :
                  state === 'inwar'       ? timeLeftKorean(endIso)   : '';
        el.textContent = t ? `⏱ ${t}` : '';
      });
    }, 1000);
  }

  async function main() {
    const loading = $('#loading');
    const errBox  = $('#error');
    const root    = $('#war-root');

    loading.style.display = '';
    errBox.style.display  = 'none';

    try {
      const data = await fetchActiveWarsWithFallback();
      loading.style.display = 'none';
      renderFilters(root);
      renderData(root, data, 'all');
      bindFilter(root, data);
      startTicker(root);
    } catch (e) {
      loading.style.display = 'none';
      errBox.style.display  = '';
      errBox.textContent = `전쟁 정보를 불러오지 못했습니다: ${e.message}`;
    }
  }

  document.addEventListener('DOMContentLoaded', main);
})();

// ===== 폴백 수집기 =====
async function fetchActiveWarsWithFallback() {
  const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const activeUrl = isLocal ? '/api/clan/wars/active' : '/api/clan?route=wars_active';
  const clanUrl   = isLocal ? '/api/clan' : '/api/clan?route=clan_list';
  
  // ✅ encodeURIComponent로 태그 인코딩!
  const detailUrl = (tag, source, warTag = '') => {
    const encodedTag = encodeURIComponent(tag);
    const encodedWarTag = warTag ? `&warTag=${encodeURIComponent(warTag)}` : '';
    const params = `clanTag=${encodedTag}&source=${source}${encodedWarTag}`;
    return isLocal
      ? `/api/clan/wars/detail?${params}`
      : `/api/clan?route=wars_detail&${params}`;
  };

  // 1️⃣ 우선 active 시도
  try {
    const res = await fetch(activeUrl);
    if (!res.ok) throw new Error(String(res.status));
    return await res.json();
  } catch (e) {
    if (!String(e.message).startsWith('404')) throw e;
  }

  // 2️⃣ 폴백
  const clansRes = await fetch(clanUrl);
  if (!clansRes.ok) throw new Error(`${clanUrl} ${clansRes.status}`);
  const clansJson = await clansRes.json();
  const clans = Array.isArray(clansJson?.clans) ? clansJson.clans : [];

  const tasks = [];
  clans.forEach(c => {
    const tag = c?.tag;
    if (!tag) return;
    tasks.push(fetch(detailUrl(tag, 'normal', '')).then(r => r.json()));
    tasks.push(fetch(detailUrl(tag, 'league', '')).then(r => r.json()));
  });

  const results = (await Promise.allSettled(tasks))
    .map(x => (x.status === 'fulfilled' ? x.value : null))
    .filter(Boolean)
    .map(j => ({ source: j.source, war: j.war || j }));

  const activeWars = results.filter(it => {
    const s = String(it?.war?.state || '').toLowerCase();
    return s === 'preparation' || s === 'inwar';
  });

  return { activeWars };
}

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.roster-btn');
  if (!btn) return;

  const card = btn.closest('.war-card');
  if (!card) return;

  let panel = card.querySelector('.roster');
  if (!panel) {
    panel = document.createElement('div');
    panel.className = 'roster';
    panel.hidden = true;
    panel.innerHTML = `<div class="roster-inner">불러오는 중…</div>`;
    const head = card.querySelector('.card-head');
    if (head && head.nextSibling) card.insertBefore(panel, head.nextSibling);
    else card.appendChild(panel);
  }
  let inner = panel.querySelector('.roster-inner');
  if (!inner) {
    inner = document.createElement('div');
    inner.className = 'roster-inner';
    panel.appendChild(inner);
  }

  panel.hidden = !panel.hidden;
  if (panel.hidden) return;
  if (panel.dataset.loaded) return;

  const cachedWar = card.__war;
  if (cachedWar && cachedWar.clan && cachedWar.opponent) {
    inner.innerHTML = renderRosterTables(cachedWar);
    panel.dataset.loaded = '1';
    return;
  }

  inner.textContent = '불러오는 중…';
  try {
    const q = new URLSearchParams({
      route: 'wars_detail',
      clanTag: btn.dataset.clantag || '',
      source:  btn.dataset.source  || 'normal',
      warTag:  btn.dataset.wartag  || ''
    });
    const resp = await fetch(`/api/clan?${q}`);
    const data = await resp.json().catch(() => ({}));
    const war = data?.war || null;

    if (!war || !war.clan || !war.opponent) {
      inner.innerHTML = `<div class="empty">표시할 전쟁 데이터가 없습니다.</div>`;
    } else {
      inner.innerHTML = renderRosterTables(war);
      card.__war = war;
    }
    panel.dataset.loaded = '1';
  } catch (err) {
    console.error(err);
    inner.innerHTML = `<div class="empty">로드 실패</div>`;
  }
});

function renderRosterTables(war) {
  // --- Guard ---
  if (!war || typeof war !== 'object') {
    return `<div class="empty">전쟁 정보가 비어 있습니다.</div>`;
  }

  // --- Local helpers ---
  const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  const getDestr = (a) => {
    const v = (a?.destruction ?? a?.destructionPercentage);
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const fmtPct = (n) => (n == null ? '-' : `${Math.round(n)}%`);

  const renderStars = (count) => {
    const s = Number(count) || 0;
    let html = '';
    for (let i = 1; i <= 3; i++) {
      html += `<span class="star ${i <= s ? 'on' : 'off'}">★</span>`;
    }
    return `<span class="stars3">${html}</span>`;
  };

  const attacksPerMember = Number(war.attacksPerMember) || 2;

  // 좌/우 전체 공격(방어 집계용)
  const allAttacks = []
    .concat(
      ...(Array.isArray(war?.clan?.members) ? war.clan.members.map(m => m.attacks || []) : []),
      ...(Array.isArray(war?.opponent?.members) ? war.opponent.members.map(m => m.attacks || []) : [])
    )
    .flat()
    .filter(Boolean);

  // --- One side builder ---
  const buildSide = (team) => {
    if (!team || !Array.isArray(team.members)) {
      return `
        <div class="roster-side">
          <h4>${team?.name || 'Clan'}</h4>
          <div class="empty">멤버 데이터가 없습니다.</div>
        </div>`;
    }

    const isLeft = war?.clan?.tag === team?.tag;
    const enemy  = isLeft ? (war?.opponent?.members || []) : (war?.clan?.members || []);

    const rows = team.members
      .slice()
      .sort((a, b) => (a?.mapPosition || 999) - (b?.mapPosition || 999))
      .map(m => {
        const atkList = Array.isArray(m?.attacks) ? m.attacks : [];

        // 공격 1/2
        const atkCells = [];
        for (let i = 0; i < attacksPerMember; i++) {
          const atk = atkList[i];
          if (atk) {
            const tgt   = enemy.find(x => x?.tag === atk?.defenderTag);
            const tpos  = tgt?.mapPosition ?? '?';
            const tname = tgt?.name ? esc(tgt.name) : '';
            const targetLabel = tpos !== '?' ? (tname ? `${tpos}. ${tname}` : `${tpos}`) : (tname || '-');

            const destr = getDestr(atk);
            const stars = Number(atk?.stars) || 0;

            // 퍼센트 먼저, 그 다음 별
            atkCells.push(`
              <div class="attack-result">
                <span class="atk-label">공격 ${i + 1}</span>
                <span class="atk-target">${targetLabel}</span>
                <span class="atk-metrics">
                  <span class="atk-outcome">${fmtPct(destr)}</span>
                  <span class="atk-stars">${renderStars(stars)}</span>
                </span>
              </div>
            `);
          } else {
            atkCells.push(`
              <div class="attack-result none">
                <span class="atk-label">공격 ${i + 1}</span>
                <span class="atk-outcome">-</span>
              </div>
            `);
          }
        }

        // 방어: 성공(0★) 카운트 / 총 방어
        const myTag = m?.tag;
        const defList = myTag ? allAttacks.filter(a => a?.defenderTag === myTag) : [];
        const defTotal   = defList.length;
        const defSuccess = defList.reduce((n, a) => n + (Number(a?.stars) < 3 ? 1 : 0), 0);

        // 최고 피격 결과(★ 우선, 동률시 파괴율 큰 것)
        const best = defList.slice().sort(
          (a,b)=>(Number(b?.stars||0)-Number(a?.stars||0)) ||
                  ((getDestr(b)||0)-(getDestr(a)||0))
        )[0];

        const bestStars = best?.stars || 0;
        const bestPct   = getDestr(best);

        return `
          <tr>
            <td class="pos">${m?.mapPosition ?? '-'}</td>
            <td class="name">${esc(m?.name ?? '-')}</td>
            <td class="attacks-cell">${atkCells.join('')}</td>
            <td class="defense-cell">
              <div class="defense-grid">
                <div class="def-stars">${renderStars(bestStars)}</div>
                <div class="def-label">방어:</div>
                <div class="def-pct">${fmtPct(bestPct)}</div>
                <div class="def-success">${defSuccess}/${defTotal}</div>
              </div>
            </td>
          </tr>`;
      }).join('');

    return `
      <div class="roster-side">
        <h4>${esc(team?.name) || 'Clan'}</h4>
        <table class="roster-table pretty">
          <thead>
            <tr><th>#</th><th>이름</th><th>공격</th><th>방어</th></tr>
          </thead>
          <tbody>${rows || `<tr><td colspan="4" class="empty">멤버 데이터 없음</td></tr>`}</tbody>
        </table>
      </div>`;
  };

  return `<div class="roster-grid">${buildSide(war.clan)}${buildSide(war.opponent)}</div>`;
}

function getDestr(a){
  // API가 destruction 또는 destructionPercentage로 줄 수 있으므로 둘 다 대응
  const v = (a?.destruction ?? a?.destructionPercentage);
  const n = Number(v);
  return Number.isFinite(n) ? n : null; // NaN 방지
}
function fmtPct(n){ return n == null ? '-' : `${Math.round(n)}%`; }
function renderStars(count){
  const s = Number(count) || 0;
  let html = '';
  for (let i=1; i<=3; i++){
    html += `<span class="star ${i<=s?'on':'off'}">★</span>`;
  }
  return `<span class="stars3">${html}</span>`;
}
