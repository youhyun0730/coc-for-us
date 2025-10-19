/* war.js — Final (frontend)
 * Aggregates active wars across all clans in COC_CLAN_TAGS.
 * Expects backend endpoint:
 *   GET /api/clan/wars/active -> { count, activeWars: [{ source, clanTag, war }, ...] }
 * Fallback (optional): use single-clan endpoints if needed.
 */

(() => {
  const $ = (sel, ctx=document) => ctx.querySelector(sel);

  async function safeFetch(url, init) {
    try {
      const res = await fetch(url, init);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return await res.json();
    } catch (err) {
      console.error('Fetch error:', url, err);
      return null;
    }
  }

  function fmt(n) {
    if (n === null || n === undefined) return '-';
    return n.toLocaleString();
  }

  function timeLeft(endTimeISO) {
    if (!endTimeISO) return '';
    const end = new Date(endTimeISO);
    const now = new Date();
    const ms = end - now;
    if (isNaN(ms)) return '';
    if (ms <= 0) return 'ended';

    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  function thIcon(level) {
    return `<span class="th">TH ${level ?? '-'}</span>`;
  }

  function renderWarCard(wrap, entry) {
    const { source, clanTag, war } = entry;
    const state = war?.state ?? 'unknown'; // preparation | inWar | warEnded | notInWar
    const isLeague = source === 'league';
    const clan = war?.clan || {};
    const opp = war?.opponent || {};

    const size = war?.teamSize ?? '-';
    const attacksPerMember = war?.attacksPerMember ?? 2;

    const prepEnd = war?.preparationStartTime ? war?.startTime : null;
    const warEnd = war?.endTime || null;
    const timer = state === 'preparation' ? timeLeft(war?.startTime) :
                  state === 'inWar' ? timeLeft(warEnd) : '';

    const div = document.createElement('div');
    div.className = `war-card ${state}`;

    div.innerHTML = `
      <div class="war-head">
        <div class="war-tags">
          <span class="badge ${isLeague ? 'league' : 'normal'}">${isLeague ? 'CWL' : 'War'}</span>
          <span class="clan-tag">${clanTag || ''}</span>
          <span class="state">${state}</span>
          ${timer ? `<span class="timer">⏱ ${timer}</span>` : ''}
        </div>
        <div class="war-size">👥 ${size} × ${size} ・ 🔁 ${attacksPerMember}/member</div>
      </div>
      <div class="sides">
        <div class="side left">
          <div class="name">${clan?.name ?? 'Unknown'} <span class="tag">${clan?.tag ?? ''}</span></div>
          <div class="meta">
            ${thIcon(clan?.townHallLevel)}
            <span>⭐ ${fmt(clan?.stars)}</span>
            <span>⚔️ ${fmt(clan?.attacks)}</span>
            <span> destruction ${fmt(Math.round((clan?.destructionPercentage ?? 0) * 100) / 100)}%</span>
          </div>
        </div>
        <div class="vs">VS</div>
        <div class="side right">
          <div class="name">${opp?.name ?? 'Unknown'} <span class="tag">${opp?.tag ?? ''}</span></div>
          <div class="meta">
            ${thIcon(opp?.townHallLevel)}
            <span>⭐ ${fmt(opp?.stars)}</span>
            <span>⚔️ ${fmt(opp?.attacks)}</span>
            <span> destruction ${fmt(Math.round((opp?.destructionPercentage ?? 0) * 100) / 100)}%</span>
          </div>
        </div>
      </div>
      <div class="progress">
        ${state === 'preparation' ? '<div class="muted">준비 중…</div>' : ''}
        ${state === 'inWar' ? '<div>전쟁 진행 중</div>' : ''}
        ${state === 'warEnded' ? '<div class="muted">전쟁 종료</div>' : ''}
      </div>
    `;

    wrap.appendChild(div);
  }

  function renderActiveWars(container, payload) {
    container.innerHTML = '';
    const list = payload?.activeWars || [];
    if (!list.length) {
      container.innerHTML = `<div class="empty">진행 중인 전쟁이 없습니다.</div>`;
      return;
    }
    for (const entry of list) {
      renderWarCard(container, entry);
    }
  }

  async function loadAllActive() {
    const data = await safeFetch('/api/clan-api/wars/active');
    return data;
  }

  async function main() {
    const container = document.querySelector('#war-root') 
               || document.querySelector('#war-list') 
               || document.body;
    const spinner = document.querySelector('#loading');
    spinner && (spinner.style.display = 'block');

    const data = await loadAllActive();

    spinner && (spinner.style.display = 'none');

    if (!data) {
      container.innerHTML = `<div class="error">전쟁 정보를 불러오지 못했습니다.</div>`;
      return;
    }
    renderActiveWars(container, data);

    // optional: live timer update each second
    setInterval(() => {
      const timers = document.querySelectorAll('.war-card .timer');
      timers.forEach(el => {
        const card = el.closest('.war-card');
        // recompute by re-rendering is heavy; skip for simplicity
      });
    }, 1000);
  }

  document.addEventListener('DOMContentLoaded', main);
})();
