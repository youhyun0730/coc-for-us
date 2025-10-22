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
    // API 필드 네이밍 케이스 흡수
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


function computeSideStats(side, attacksPerMember, size){
  const members = Array.isArray(side?.members) ? side.members : [];
  const totalPossible = (Number(size)||0) * (Number(attacksPerMember)||0);
  let atkCount = 0;
  let destrSum = 0;
  members.forEach(m=>{
    const atks = Array.isArray(m?.attacks) ? m.attacks : [];
    atks.forEach(a=>{
      if (a && typeof a.destructionPercentage !== 'undefined') {
        atkCount += 1;
        destrSum += Number(a.destructionPercentage)||0;
      }
    });
  });
  const avgDestr = atkCount ? Math.round((destrSum/atkCount)*10)/10 : 0;
  return { used: atkCount, total: totalPossible, avg: avgDestr };
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

    const state = (war.state || '').toLowerCase(); // preparation / inWar / warEnded
    const size  = war?.teamSize ?? war?.teamSize ?? 15;
    const apm   = war?.attacksPerMember ?? 2;

    const clan  = war?.clan || {};
    const opp   = war?.opponent || {};
    const endAt = war?.endTime || war?.endTimeUTC || war?.endTimeIso;
    const start = war?.startTime || war?.preparationStartTime || war?.startTimeUTC;

    const statsL = computeSideStats(clan, apm, size);
    const statsR = computeSideStats(opp, apm, size);
    const usedL = statsL.used;
    const usedR = statsR.used;
    const total = statsL.total;
    const avgL = statsL.avg;
    const avgR = statsR.avg;

    const leftStars  = fmt(clan?.stars);
    const rightStars = fmt(opp?.stars);

    const leftDest  = Math.round((clan?.destructionPercentage ?? 0) * 100) / 100;
    const rightDest = Math.round((opp?.destructionPercentage ?? 0) * 100) / 100;

    const timer = state === 'preparation' ? timeLeftKorean(start) : state === 'inwar' ? timeLeftKorean(endAt) : '';
    // 카드
    const el = document.createElement('article');
    el.className = `war-card is-${state} ${isLeague ? 'type-league' : 'type-normal'}`;
    el.__startIso = start || null;
    el.__endIso   = endAt || null;
    el.__state    = state;
    el.innerHTML = `
      <header class="card-head">
        <span class="badge ${isLeague ? 'league' : 'normal'}">${isLeague ? '리그전' : '클랜전'}</span>
        <span class="state">${koState(state)}</span>
        <span class="size">15인전</span>
        ${timer ? `<span class="timer">⏱ ${timer}</span>` : ''}
      </header>
</div>

      <div class="card-body">
        <div class="side left">
          <div class="name">${clan?.name ?? 'Unknown'} <span class="tag">${clan?.tag ?? ''}</span></div>
          <div class="meta">
            <span class="th">${thIcon(clan?.townHallLevel)}</span>
            <span>⭐ ${leftStars}</span>
            <span class="used-left">⚔️ ${fmt(usedL)} / ${fmt(total)}</span>
            <span class="avg-left">💥 ${avgL}%</span>
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
            <span class="avg-right">💥 ${avgR}%</span>
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
<div class=\"roster\" hidden></div>      
    `;
    el.__war = war;
    // fetch detail to enrich stats/timer
    enrichCard(el, war, isLeague);
    return el;
  }

  
async function enrichCard(card, war, isLeague){
  try{
    const clanTag = war?.clan?.tag || '';
    const warTag  = war?.warTag  || '';
    const source  = isLeague ? 'league' : 'normal';
    if (!clanTag) return;
    const res = await fetch(`/api/clan/wars/detail?clanTag=${encodeURIComponent(clanTag)}&source=${encodeURIComponent(source)}&warTag=${encodeURIComponent(warTag)}`);
    const data = await res.json();
    // recompute stats
    const apm  = Number(data?.attacksPerMember ?? war?.attacksPerMember ?? 2);
    const size = Number(data?.teamSize ?? war?.teamSize ?? 15);
    const statsL = computeSideStats(data?.clan, apm, size);
    const statsR = computeSideStats(data?.opponent, apm, size);
    const usedL = card.querySelector('.used-left');
    const usedR = card.querySelector('.used-right');
    const avgL  = card.querySelector('.avg-left');
    const avgR  = card.querySelector('.avg-right');
    if (usedL) usedL.textContent = `⚔️ ${statsL.used} / ${statsL.total}`;
    if (usedR) usedR.textContent = `⚔️ ${statsR.used} / ${statsR.total}`;
    if (avgL)  avgL.textContent  = `💥 ${statsL.avg}%`;
    if (avgR)  avgR.textContent  = `💥 ${statsR.avg}%`;
    // timer (use broader set of fields)
    const state = (data?.state || '').toLowerCase();
    const endAt   = data?.endTime || data?.endTimeUTC || data?.endTimeIso;
    const startAt = data?.startTime || data?.preparationStartTime || data?.startTimeUTC;
    const t = state==='preparation' ? timeLeftKorean(startAt) : state==='inwar' ? timeLeftKorean(endAt) : '';
    const ts = card.querySelector('.timer');
    if (ts) ts.textContent = t ? `⏱ ${t}` : '';
  }catch(e){
    // silently ignore
  }
}
function renderData(root, data, currentFilter = 'all') {
    // 그룹 컨테이너
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
      contIn.innerHTML   = '';
      contEnd.innerHTML  = '';
      return;
    }

    list.forEach((it) => {
      const state = getState(it.war || it);
      const card = warCard(it);
      if (state === 'preparation') contPrep.appendChild(card);
      else if (state === 'inwar' || state === 'inWar') contIn.appendChild(card);
      else if (state === 'warended' || state === 'warEnded') {
        // 보통 이 페이지는 active만 오지만, 혹시 오면 표시
        document.querySelector('[data-group="warEnded"]').style.display = '';
        contEnd.appendChild(card);
      } else {
        contIn.appendChild(card);
      }
    });

    // 섹션이 비면 접기
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

  // 타이머 갱신(1초)
  
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
      const data = await safeFetch('/api/clan/wars/active');
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

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.roster-btn');
  if (!btn) return;

  const card = btn.closest('.war-card');
  if (!card) return;

  // 패널/내부 엘리먼트 확보 (없으면 즉석 생성)
  let panel = card.querySelector('.roster');
  if (!panel) {
    panel = document.createElement('div');
    panel.className = 'roster';
    panel.hidden = true;
    panel.innerHTML = `<div class="roster-inner">불러오는 중…</div>`;
    // 헤더 다음 위치에 삽입
    const head = card.querySelector('.card-head');
    if (head && head.nextSibling) {
      card.insertBefore(panel, head.nextSibling);
    } else {
      card.appendChild(panel);
    }
  }
  let inner = panel.querySelector('.roster-inner');
  if (!inner) {
    inner = document.createElement('div');
    inner.className = 'roster-inner';
    panel.appendChild(inner);
  }

  // 토글
  panel.hidden = !panel.hidden;
  if (panel.hidden) return;

  // 이미 로드했다면 재호출 X
  if (panel.dataset.loaded) return;

  // 1) 캐시 우선
  const cachedWar = card.__war;
  if (cachedWar && cachedWar.clan && cachedWar.opponent) {
    inner.innerHTML = renderRosterTables(cachedWar);
    panel.dataset.loaded = '1';
    return;
  }

  // 2) 캐시 없으면 API 호출 (보조 경로)
  inner.textContent = '불러오는 중…';
  try {
    const q = new URLSearchParams({
      clanTag: btn.dataset.clantag || '',
      source:  btn.dataset.source  || 'normal',
      warTag:  btn.dataset.wartag  || ''
    });
    const resp = await fetch(`/api/clan/wars/detail?${q}`);
    const data = await resp.json().catch(() => ({}));
    const war = data?.war || null;

    if (!war || !war.clan || !war.opponent) {
      inner.innerHTML = `<div class="empty">표시할 전쟁 데이터가 없습니다.</div>`;
    } else {
      inner.innerHTML = renderRosterTables(war);
      card.__war = war; // 성공 시 캐시
    }
    panel.dataset.loaded = '1';
  } catch (err) {
    console.error(err);
    inner.innerHTML = `<div class="empty">로드 실패</div>`;
  }
});

function renderRosterTables(war) {
  const oppMap = (side)=>{
    const list = Array.isArray(side?.members)? side.members:[];
    const map = {};
    list.forEach(mm=>{ if(mm?.tag) map[mm.tag]=mm; });
    return map;
  };
  // 널/형식 가드
  if (!war || typeof war !== 'object') {
    return `<div class="empty">전쟁 정보가 비어 있습니다.</div>`;
  }
  const attacksPerMember = Number(war.attacksPerMember) || 2;
  // 전체 공격 풀 (좌/우 모두)
  const allAttacks = []
    .concat(
      ...(Array.isArray(war?.clan?.members) ? war.clan.members.map(m=>m.attacks||[]) : []),
      ...(Array.isArray(war?.opponent?.members) ? war.opponent.members.map(m=>m.attacks||[]) : [])
    )
    .flat()
    .filter(Boolean);
  const buildSide = (team) => {
    if (!team || !Array.isArray(team.members)) {
      return `
        <div class="roster-side">
          <h4>${team?.name || 'Clan'}</h4>
          <div class="empty">멤버 데이터가 없습니다.</div>
        </div>`;
    }

    const rows = team.members
      .slice()
      .sort((a, b) => (a?.mapPosition || 999) - (b?.mapPosition || 999))
      .map(m => {
        const atkList = Array.isArray(m?.attacks) ? m.attacks : [];
        const usedAttacks = atkList.length;
        const sumStars = atkList.reduce((s,a)=> s + (Number(a?.stars)||0), 0);
        const maxDestr = atkList.reduce((mx,a)=> Math.max(mx, Number(a?.destructionPercentage)||0), 0);

        // 방어 집계(상대의 공격 중 내가 수비한 것)
        const myTag = m?.tag;
        const defList = myTag ? allAttacks.filter(a => a?.defenderTag === myTag) : [];
        const defUsed = defList.length;
        const defStars = defList.reduce((s,a)=> s + (Number(a?.stars)||0), 0);
        const defMax = defList.reduce((mx,a)=> Math.max(mx, Number(a?.destructionPercentage)||0), 0);

        return `
          <tr>
            <td class="pos">${m?.mapPosition ?? '-'}</td>
            <td class="name">${m?.name ?? '-'}</td>
            <td class="used">${usedAttacks}/${attacksPerMember}</td>
            <td class="stars">${sumStars} ★</td>
                        <td class="def-best">${(function(){ if(defList.length===0) return "-"; const best = defList.slice().sort((a,b)=> (Number(b.stars||0)-Number(a.stars||0)) || (Number(b.destructionPercentage||0)-Number(a.destructionPercentage||0)) )[0]; return `${Number(best.stars||0)} ★ ${Number(best.destructionPercentage||0)}%`; })()}</td>
          </tr>`;
      }).join('');

    return `
      <div class="roster-side">
        <h4>${team?.name || 'Clan'}</h4>
        <table class="roster-table">
          <thead>
            <tr>
              <th>#</th><th>이름</th><th>공격</th><th>획득 별</th><th>피격 결과</th>
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr><td colspan="5" class="empty">멤버 데이터 없음</td></tr>`}
          </tbody>
        </table>
      </div>`;
  };

  const left  = buildSide(war.clan);
  const right = buildSide(war.opponent);

  return `<div class="roster-grid">${left}${right}</div>`;
}
