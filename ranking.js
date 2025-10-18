// ranking.js
window.addEventListener('load', () => {
  const criteriaSelect = document.getElementById('rankingCriteria');
  const rankingList = document.getElementById('rankingList');
  const loading = document.getElementById('loading');
  const errorDiv = document.getElementById('error');

  if (!criteriaSelect || !rankingList) {
    console.error('ranking.html의 요소를 찾을 수 없습니다.');
    return;
  }

  /** 🕓 PLAYERS 데이터가 준비될 때까지 기다리는 함수 */
  async function waitForPlayers(timeout = 5000) {
    const interval = 100;
    let waited = 0;
    return new Promise((resolve, reject) => {
      const check = setInterval(() => {
        if (window.PLAYERS && Array.isArray(window.PLAYERS) && window.PLAYERS.length > 0) {
          clearInterval(check);
          resolve(window.PLAYERS);
        } else if (waited >= timeout) {
          clearInterval(check);
          reject(new Error('PLAYERS 데이터가 없습니다.'));
        }
        waited += interval;
      }, interval);
    });
  }

  async function initRanking() {
    loading.style.display = 'block';
    errorDiv.style.display = 'none';
    rankingList.innerHTML = '';

    try {
      const players = await waitForPlayers();
      renderRanking(players, criteriaSelect.value);
    } catch (err) {
      console.error(err);
      errorDiv.textContent = `오류가 발생했습니다: ${err.message}`;
      errorDiv.style.display = 'block';
    } finally {
      loading.style.display = 'none';
    }
  }

  /** 🔹 기준 변경 시 다시 정렬 */
  criteriaSelect.addEventListener('change', () => {
    if (window.PLAYERS && Array.isArray(window.PLAYERS)) {
      renderRanking(window.PLAYERS, criteriaSelect.value);
    }
  });

  /** 🔸 랭킹 표시 함수 */
  function renderRanking(players, criteria) {
    let sorted = [...players];

    if (criteria === 'townHall') {
      sorted.sort((a, b) => b.townHallLevel - a.townHallLevel);
    } else if (criteria === 'heroSum') {
      sorted.sort((a, b) => calculateTotalHeroLevels(b) - calculateTotalHeroLevels(a));
    } else if (criteria === 'expLevel') {
      sorted.sort((a, b) => (b.expLevel || 0) - (a.expLevel || 0));
    } else if (criteria === 'competitive') {
      sorted.sort((a, b) => {
        const idA = a.leagueTier?.id || 0;
        const idB = b.leagueTier?.id || 0;
        if (idA !== idB) return idB - idA;
        return (b.trophies || 0) - (a.trophies || 0);
      });
    }

    rankingList.innerHTML = '';

    /** 🩵 동점 순위 계산용 변수 */
    let prevScore = null;
    let rankNum = 0;
    let displayRank = 0;

    sorted.forEach((player) => {
      // 🔹 점수 기준값
      let scoreValue;
      if (criteria === 'townHall') scoreValue = player.townHallLevel;
      else if (criteria === 'heroSum') scoreValue = calculateTotalHeroLevels(player);
      else if (criteria === 'expLevel') scoreValue = player.expLevel;
      else if (criteria === 'competitive')
        scoreValue = `${player.leagueTier?.id || 0}-${player.trophies || 0}`;

      // 🔹 동점 체크
      if (scoreValue !== prevScore) {
        displayRank = rankNum + 1;
        prevScore = scoreValue;
      }
      rankNum++;

      // 🔸 카드 생성
      const rankCard = document.createElement('div');
      rankCard.className = 'ranking-card';

      const iconSrc = getIconSrc(player, criteria);
      let scoreText = '';

      if (criteria === 'townHall') {
        scoreText = `TH Lv.${player.townHallLevel}`;
      } else if (criteria === 'heroSum') {
        const total = calculateTotalHeroLevels(player);
        scoreText = `영웅 합 ${total}`;
      } else if (criteria === 'expLevel') {
        scoreText = `경험치 Lv.${player.expLevel}`;
      } else if (criteria === 'competitive') {
        scoreText = `${player.leagueTier?.name || 'Unranked'} · ${player.trophies?.toLocaleString() || 0} <img src="images/icon/Trophy.png" alt="trophy" class="trophy-icon">`;
      }

      rankCard.innerHTML = `
        <div class="rank-num">#${displayRank}</div>
        <div class="rank-info">
          <div class="rank-main">
            ${getIconHTML(iconSrc, criteria, player)}
            <div class="rank-text">
              <h3>${player.name || '이름 없음'}</h3>
              <p class="rank-detail">${scoreText}</p>
            </div>
          </div>
        </div>
      `;

      rankingList.appendChild(rankCard);
    });
  }

  /** 🔸 아이콘 이미지 소스 */
  function getIconSrc(player, criteria) {
    // 타운홀/영웅합 → 타운홀 이미지, 경험치 → xp, 경쟁전 → 리그
    if (criteria === 'townHall' || criteria === 'heroSum') {
      return `images/town-hall/Building_HV_Town_Hall_level_${player.townHallLevel}.png`;
    } else if (criteria === 'competitive') {
      return player.leagueTier?.icon?.url || '';
    } else if (criteria === 'expLevel') {
      return 'images/icon/xp.png';
    }
    return '';
  }

  /** 🔸 아이콘 HTML (경험치용 오버레이 포함) */
  function getIconHTML(src, criteria, player) {
    if (!src) return '';
    if (criteria === 'expLevel') {
      return `
        <div class="xp-icon-wrapper">
          <img class="rank-icon xp-icon" src="${src}" alt="XP">
          <span class="xp-level">${player.expLevel}</span>
        </div>
      `;
    } else {
      return `<img class="rank-icon" src="${src}" alt="icon" onerror="this.style.display='none';">`;
    }
  }

  /** ✅ app.js의 영웅 레벨 합산 로직 그대로 복사 */
  function calculateTotalHeroLevels(player) {
    if (!player.heroes || player.heroes.length === 0) return 0;
    return player.heroes
      .filter(hero => {
        const name = hero.name?.toLowerCase() || '';
        return !name.includes('battle machine') &&
               !name.includes('battle copter') &&
               !name.includes('배틀 머신') &&
               !name.includes('배틀 콥터');
      })
      .reduce((total, hero) => total + hero.level, 0);
  }

  // 초기 실행
  initRanking();
});
