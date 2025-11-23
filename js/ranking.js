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
    } else if (criteria === 'petSum') {
      sorted.sort((a, b) => calculateTotalPetLevels(b) - calculateTotalPetLevels(a));
    } else if (criteria === 'expLevel') {
      sorted.sort((a, b) => (b.expLevel || 0) - (a.expLevel || 0));
    } else if (criteria === 'competitive') {
      sorted.sort((a, b) => {
        const idA = a.leagueTier?.id || 0;
        const idB = b.leagueTier?.id || 0;
        if (idA !== idB) return idB - idA;
        return (b.trophies || 0) - (a.trophies || 0);
      });
    } else if (criteria === 'donations') {
      sorted.sort((a, b) => getAchievementValue(b, 'Friend in Need') - getAchievementValue(a, 'Friend in Need'));
    } else if (criteria === 'spellDonations') {
      sorted.sort((a, b) => getAchievementValue(b, 'Sharing is caring') - getAchievementValue(a, 'Sharing is caring'));
    } else if (criteria === 'siegeDonations') {
      sorted.sort((a, b) => getAchievementValue(b, 'Siege Sharer') - getAchievementValue(a, 'Siege Sharer'));
    } else if (criteria === 'warStars') {
      sorted.sort((a, b) => (b.warStars || 0) - (a.warStars || 0));
    } else if (criteria === 'obstacleRemoval') {
      sorted.sort((a, b) => getAchievementValue(b, 'Nice and Tidy') - getAchievementValue(a, 'Nice and Tidy'));
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
      else if (criteria === 'petSum') scoreValue = calculateTotalPetLevels(player);
      else if (criteria === 'expLevel') scoreValue = player.expLevel;
      else if (criteria === 'competitive')
        scoreValue = `${player.leagueTier?.id || 0}-${player.trophies || 0}`;
      else if (criteria === 'donations') scoreValue = getAchievementValue(player, 'Friend in Need');
      else if (criteria === 'spellDonations') scoreValue = getAchievementValue(player, 'Sharing is caring');
      else if (criteria === 'siegeDonations') scoreValue = getAchievementValue(player, 'Siege Sharer');
      else if (criteria === 'warStars') scoreValue = player.warStars || 0;
      else if (criteria === 'obstacleRemoval') scoreValue = getAchievementValue(player, 'Nice and Tidy');

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
      } else if (criteria === 'petSum') {
        const total = calculateTotalPetLevels(player);
        scoreText = `펫 합 ${total}`;
      } else if (criteria === 'expLevel') {
        scoreText = `경험치 Lv.${player.expLevel}`;
      } else if (criteria === 'competitive') {
        scoreText = `${player.leagueTier?.name || 'Unranked'} · ${player.trophies?.toLocaleString() || 0} <img src="images/icon/Trophy.png" alt="trophy" class="trophy-icon">`;
      } else if (criteria === 'donations') {
        scoreText = `누적 지원 ${getAchievementValue(player, 'Friend in Need').toLocaleString()}`;
      } else if (criteria === 'spellDonations') {
        scoreText = `누적 지원 마법 ${getAchievementValue(player, 'Sharing is caring').toLocaleString()}`;
      } else if (criteria === 'siegeDonations') {
        scoreText = `누적 지원 시즈 ${getAchievementValue(player, 'Siege Sharer').toLocaleString()}`;
      } else if (criteria === 'warStars') {
        scoreText = `전쟁 별 ${(player.warStars || 0).toLocaleString()} ★`;
      } else if (criteria === 'obstacleRemoval') {
        scoreText = `장애물 제거 ${getAchievementValue(player, 'Nice and Tidy').toLocaleString()}`;
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
    // 타운홀/영웅합/펫합 → 타운홀 이미지, 경험치 → xp, 경쟁전 → 리그
    if (criteria === 'townHall' || criteria === 'heroSum' || criteria === 'petSum') {
      return `images/town-hall/Building_HV_Town_Hall_level_${player.townHallLevel}.png`;
    } else if (criteria === 'competitive') {
      return player.leagueTier?.icon?.url || '';
    } else if (criteria === 'expLevel') {
      return 'images/icon/xp.png';
    } else if (criteria === 'donations' || criteria === 'spellDonations' || criteria === 'siegeDonations' || criteria === 'warStars' || criteria === 'obstacleRemoval') {
      // ✅ 새 항목들은 타운홀 이미지
      return `images/town-hall/Building_HV_Town_Hall_level_${player.townHallLevel}.png`;
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

  /** ✅ achievements에서 name으로 value 가져오기 */
  function getAchievementValue(player, achievementName) {
    if (!player.achievements || !Array.isArray(player.achievements)) return 0;
    const achievement = player.achievements.find(a => a.name === achievementName);
    return achievement?.value || 0;
  }

  /** ✅ 영웅 레벨 합 계산 */
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

  /** ✅ 펫 레벨 합 계산 (player.troops 기반) */
function calculateTotalPetLevels(player) {
  const pets = getPetsFromPlayer(player);
  if (!pets || pets.length === 0) return 0;

  return pets.reduce((sum, pet) => sum + (pet.level || 0), 0);
}

  // 초기 실행
  initRanking();
});
