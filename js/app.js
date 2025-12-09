// 英雄の装備を取得
function getEquipmentForHero(heroName, allEquipment) {
  const normalizedHeroName = heroNameMapping[heroName] || heroName;
  const heroEquipmentNames = heroEquipmentMapping[normalizedHeroName] || [];

  // 1️⃣ 장비 이름 매핑
  const owned = allEquipment.map(equipment => {
    const normalizedEquipmentName = equipmentNameMapping[equipment.name] || equipment.name;
    return { ...equipment, normalizedName: normalizedEquipmentName };
  });

  // 2️⃣ 영웅이 가질 수 있는 장비 목록(heroEquipmentNames)을 기준으로 전체 배열 생성
  const completeList = heroEquipmentNames.map(name => {
    const match = owned.find(e => e.normalizedName === name);
    if (match) {
      // 보유 장비 (정상 표시)
      return { ...match, owned: true };
    } else {
      // 미보유 장비 (레벨 없음)
      return { name, level: '', owned: false }; 
    }
  });

  // 3️⃣ heroEquipmentNames 순서 유지
  return completeList;
}

function createHeroesSection(player) {
  if (!player.heroes || player.heroes.length === 0) return '';

  const heroes = player.heroes.filter(h => h.village === 'home');
  const selectedHero = heroes[0]; // 기본 첫 번째 영웅 선택

  const renderHeroRow = () => {
    return `
      <div class="hero-row">
        ${heroes.map((hero, idx) => {
          const img = getHeroImageSrc(hero.name);
          const isSelected = idx === 0;
        
          // ✅ 만렙 여부 판정
          const isMax = hero.level >= hero.maxLevel;
          const levelClass = isMax ? 'max' : '';

          return `
            <div class="hero-card ${isSelected ? 'selected' : ''}" 
                onclick="selectHero('${hero.name}', this)">
              <img class="hero-image" src="${img}" alt="${hero.name}" />
              <div class="hero-level ${levelClass}">${hero.level}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  };

  const renderEquipmentRows = (hero) => {
  const equipments = getEquipmentForHero(hero.name, player.heroEquipment || []);

  // 첫 4개 / 나머지 3개로 단순 분할
  const firstRow = equipments.slice(0, 4);
  const secondRow = equipments.slice(4, 7);

  const renderEquipRow = (list, isSecondRow = false) => list.map(e => {
      const img = getEquipmentImageSrc(e.name, hero.name);
      const extraClass = isSecondRow ? 'second-row' : 'first-row';
      const style = e.owned ? '' : 'filter: grayscale(100%); opacity: 0.4;';
      const isMaxLevel = e.level >= e.maxLevel;
      const maxlevelClass = isMaxLevel ? 'max' : 'normal';
      // ✅ 레벨 박스는 보유 장비일 때만 생성
      const levelBox = e.owned
        ? `<div class="equip-level ${maxlevelClass}">${e.level}</div>`
        : '';

      return `
        <div class="equip-card">
          <img class="equip-image ${extraClass}" src="${img}" alt="${e.name}" style="${style}" />
          ${levelBox}
        </div>
      `;
    }).join('');

  return `
    <div class="equip-section" id="equip-section">
      <div class="equip-row">${renderEquipRow(firstRow, false)}</div>
      <div class="equip-row">${renderEquipRow(secondRow, true)}</div>
    </div>
  `;
};


  return `
    <div class="heroes-section">
      <div class="section-title">영웅 및 장비</div>
      ${renderHeroRow()}
      ${renderEquipmentRows(selectedHero)}
    </div>
  `;
}

// === 클릭 이벤트 함수 (전역 함수로 추가) ===
function selectHero(heroName, el) {
  const section = el.closest('.heroes-section');
  const heroes = section.querySelectorAll('.hero-card');
  heroes.forEach(h => h.classList.remove('selected'));
  el.classList.add('selected');

  const playerIndex = section.closest('.player-card').dataset.index;
  const player = window.PLAYERS?.[playerIndex];
  const hero = player?.heroes?.find(h => h.name === heroName);
  if (!hero) return;

  const oldEquip = section.querySelector('#equip-section');
  if (!oldEquip) return;

  // 🔥 replaceWith는 outerHTML보다 안전
  const newEquip = document.createElement('div');
  newEquip.innerHTML = createEquipHTML(hero, player.heroEquipment || []);
  oldEquip.replaceWith(newEquip.firstElementChild);
}

// === 장비 표시 갱신용 함수 ===
function createEquipHTML(hero, heroEquipment) {
  const equipments = getEquipmentForHero(hero.name, heroEquipment || []);
  const firstRow = equipments.slice(0, 4);
  const secondRow = equipments.slice(4, 7);

  const renderEquipRow = (list, isSecondRow = false) => list.map(e => {
    const img = getEquipmentImageSrc(e.name, hero.name);
    const style = e.owned ? '' : 'filter: grayscale(100%); opacity: 0.4;';
    const level = e.owned ? e.level : '';
    const extraClass = isSecondRow ? 'second-row' : 'first-row';
    const isMaxLevel = (e) => e.level >= e.maxLevel;
    const maxlevelClass = (e) => isMaxLevel(e) ? 'max' : 'normal';

    const levelBox = e.owned
      ? `<div class="equip-level ${maxlevelClass(e)}">${level}</div>`
      : '';

    return `
      <div class="equip-card">
        <img class="equip-image ${extraClass}" src="${img}" alt="${e.name}" style="${style}" />
        ${levelBox}
      </div>
    `;
  }).join('');

  return `
    <div class="equip-section" id="equip-section">
      <div class="equip-row">${renderEquipRow(firstRow, false)}</div>
      <div class="equip-row">${renderEquipRow(secondRow, true)}</div>
    </div>
  `;
}

// 영웅 이미지를 취득
function getHeroImageSrc(heroName) {
    const heroImageNames = {
        'Barbarian King': 'Icon_HV_Hero_Barbarian_King.png',
        'Archer Queen': 'Icon_HV_Hero_Archer_Queen.png',
        'Grand Warden': 'Icon_HV_Hero_Grand_Warden.png',
        'Royal Champion': 'Icon_HV_Hero_Royal_Champion.png',
        'Minion Prince': 'Icon_HV_Hero_Minion_Prince.png'
    };
    const fileName = heroImageNames[heroName];
    return fileName ? `images/hero/${fileName}` : '';
}

// 영웅 장비 이미지를 취득
function getEquipmentImageSrc(equipmentName, heroName) {
    // 영웅별 접두어
    const heroPrefixes = {
        'Barbarian King': 'BK',
        'Archer Queen': 'AQ',
        'Grand Warden': 'GW',
        'Royal Champion': 'RC',
        'Minion Prince': 'MP'
    };

    // 장비별 파일명(영웅별 접두어 필요)
    const equipmentFileNames = {
        'Barbarian Puppet': 'Barbarian_Puppet',
        'Rage Vial': 'Rage_Vial',
        'Earthquake Boots': 'Earthquake_Boots',
        'Vampstache': 'Vampstache',
        'Giant Gauntlet': 'Giant_Gauntlet',
        'Spiky Ball': 'Spiky_Ball',
        'Snake Bracelet': 'Snake_Bracelet',

        'Archer Puppet': 'Archer_Puppet',
        'Invisibility Vial': 'Invisibility_Vial',
        'Giant Arrow': 'Giant_Arrow',
        'Healer Puppet': 'Healer_Puppet',
        'Frozen Arrow': 'Frozen_Arrow',
        'Magic Mirror': 'Magic_Mirror',
        'Action Figure': 'Action_Figure',

        'Eternal Tome': 'Eternal_Tome',
        'Life Gem': 'Life_Gem',
        'Rage Gem': 'Rage_Gem',
        'Healing Tome': 'Healing_Tome',
        'Fireball': 'Fireball',
        'Lavaloon Puppet': 'Lavaloon_Puppet',
        'Heroic Torch': 'Heroic_Torch',

        'Royal Gem': 'Royal_Gem',
        'Seeking Shield': 'Seeking_Shield',
        'Haste Vial': 'Haste_Vial',
        'Hog Rider Puppet': 'Hog_Rider_Puppet',
        'Rocket Spear': 'Rocket_Spear',
        'Electro Boots': 'Electro_Boots',
        'Frost Flake': 'Frost_Flake',

        'Henchmen Puppet': 'Henchmen_Puppet',
        'Dark Orb': 'Dark_Orb',
        'Metal Pants': 'Metal_Pants',
        'Noble Iron': 'Noble_Iron',
        'Dark Crown': 'Dark_Crown',
        'Meteor Staff': 'Meteor_Staff'
    };

    const prefix = heroPrefixes[heroName];
    const fileBase = equipmentFileNames[equipmentName];
    if (prefix && fileBase) {
        return `images/hero-equipment/Hero_Equipment_${prefix}_${fileBase}.png`;
    }
    // fallback: 기존 파일명 패턴
    return '';
}

// 英雄レベルの合計を計算
function calculateTotalHeroLevels(player) {
    if (!player.heroes || player.heroes.length === 0) {
        return 0;
    }
    // Battle MachineとBattle Copterを除外して合計
    return player.heroes
        .filter(hero => {
            const heroName = hero.name.toLowerCase();
            return !heroName.includes('battle machine') &&
                   !heroName.includes('battle copter') &&
                   !heroName.includes('배틀 머신') &&
                   !heroName.includes('배틀 콥터');
        })
        .reduce((total, hero) => total + hero.level, 0);
}

// ==== PETS: helpers (uses window.PETS) ====
function normalizePetName(raw) {
  if (!raw) return '';
  const s = String(raw).trim();
  return (window.PETS?.ALIASES && window.PETS.ALIASES[s]) ? window.PETS.ALIASES[s] : s;
}
function translatePetName(name) {
  return (window.PETS?.KO && window.PETS.KO[name]) ? window.PETS.KO[name] : name;
}
function getPetImageSrc(officialName) {
  const file = window.PETS?.IMG ? window.PETS.IMG[officialName] : '';
  return file ? `images/pets/${file}` : '';
}
function getPetsFromPlayer(player) {
  const troops = Array.isArray(player.troops) ? player.troops : [];
  const order = window.PETS?.CANONICAL_ORDER || window.PETS?.ORDER || [];
  const set = new Set(order);

  const pets = troops
    .filter(t => t && t.village === 'home')
    .map(t => ({ ...t, officialName: normalizePetName(t.name) }))
    .filter(t => set.has(t.officialName));

  pets.sort((a, b) => order.indexOf(a.officialName) - order.indexOf(b.officialName));
  return pets;
}
function createPetsSection(player) {
  const pets = getPetsFromPlayer(player);
  if (pets.length === 0) return '';

  const firstCount = Math.min(6, pets.length);
  const rows = [pets.slice(0, firstCount), pets.slice(firstCount)];

  const renderRow = (rowItems, rowIndex) => {
    const cols = rowIndex === 0 ? 6 : 5; // 1행:6, 2행:5
    const items = rowItems.map(p => {
      const img = getPetImageSrc(p.officialName);
      const owned = Number.isFinite(p.level);
      const isMax = owned && p.level >= p.maxLevel;
      const levelNum = owned ? p.level : '-';
      const badgeColor = isMax ? 'max' : 'normal';
      const imgStyle = owned ? '' : 'filter: grayscale(100%); opacity:.55;';

      return `
        <div class="pet-card">
          <div class="pet-image-container">
            <img class="pet-image" src="${img}" alt="${p.officialName}" loading="lazy"
                 onerror="this.style.display='none';" style="${imgStyle}" />
            <div class="pet-level-badge ${badgeColor}">${levelNum}</div>
          </div>
        </div>
      `;
    }).join('');

    return `<div class="pets-row row-${cols}">${items}</div>`;
  };

  return `
    <div class="pets-section">
      <div class="section-title">펫</div>
      <div class="pets-rows">
        ${renderRow(rows[0], 0)}
        ${renderRow(rows[1], 1)}
      </div>
    </div>
  `;
}
// ==== /PETS helpers ====

// 플레이어 카드를 생성하는 함수
function createPlayerCard(player, index) {
  const card = document.createElement('div');
  card.className = 'player-card';
  card.dataset.index = index;

  const totalHeroLevels = calculateTotalHeroLevels(player);

  // ✅ 리그 아이콘 URL (없으면 빈 문자열)
  const leagueIconUrl = player.leagueTier?.icon?.url || '';

  // ✅ 클랜 배지 URL 추출 (새/구 구조 모두 대응)
  const clanBadgeUrl = player.clan
    ? (player.clan.badge?.url ||
       player.clan.badgeUrls?.medium ||
       player.clan.badgeUrls?.large ||
       player.clan.badgeUrls?.small ||
       '')
    : '';

// ✅ 클랜 정보 섹션
const clanInfo = player.clan
  ? `
    <div class="clan-section">
      <div class="section-title">클랜</div>
      <div class="player-clan-box">
        ${clanBadgeUrl ? `
          <img
            class="player-clan-badge"
            src="${clanBadgeUrl}"
            alt="${player.clan.name} badge"
            loading="lazy"
            decoding="async"
            onerror="this.style.display='none';"
          />
        ` : ''}
        <div class="player-clan-meta">
          <div class="player-clan-name">${player.clan.name}</div>
          <div class="player-clan-role">${translateRole(player.role)}</div>
        </div>
      </div>
    </div>`
  : `
    <div class="clan-section">
      <div class="section-title">클랜</div>
      <div class="no-clan">클랜 미소속</div>
    </div>`;

  // ✅ 카드 본문
  card.innerHTML = `
    <div class="player-header">
      <div class="player-rank">#${index + 1}</div>

      <img
        class="town-hall-image"
        src="images/town-hall/Building_HV_Town_Hall_level_${player.townHallLevel}.png"
        alt="타운홀 ${player.townHallLevel}"
        onerror="this.style.display='none';"
      />

      <!-- ✅ 이름/태그 묶음 -->
      <div class="player-name-tag">
        <div class="player-name-info">
          <div class="player-name">${player.name}</div>
          <div class="player-tag">${player.tag}</div>
        </div>
      </div>
    </div>

    <!-- ✅ 리그 아이콘 추가 (트로피 라벨 왼쪽) -->
    <div class="competitive-section">
        <div class="section-title">경쟁전</div>
        <div class="competitive-info">
            <div class="left-info">
                ${leagueIconUrl ? `
                <img
                class="league-icon"
                src="${leagueIconUrl}"
                alt="${player.leagueTier?.name || 'League'}"
                loading="lazy"
                decoding="async"
                onerror="this.style.display='none';"
            />
        ` : ''}
            <span class="league-name">${translateLeague(player.leagueTier?.name)}</span>
        </div>

        <div class="right-info">
            <img
                class="trophy-icon"
                src="images/icon/Trophy.png"
                alt="Trophy"
                loading="lazy"
                decoding="async"
                onerror="this.style.display='none';"
            />
            <span class="trophy-value">${player.trophies.toLocaleString()}</span>
        </div>
    </div>
</div>


    ${createHeroesSection(player)}
    ${createPetsSection(player)}
    ${clanInfo}

  `;

  return card;
}

// 직책을 한국어로 번역
function translateRole(role) {
    const roles = {
        'member': '멤버',
        'elder': '장로',
        'coLeader': '공동 대표',
        'leader': '대표'
    };
    return roles[role] || role;
}

// 경쟁전 리그를 한국어로 번역
function translateLeague(league) {
    const leagues = {
        'Unranked': '언랭크',
        "Skeleton League 1" : "해골 1",
        "Skeleton League 2" : "해골 2",
        "Skeleton League 3" : "해골 3",
        "Barbarian League 4": "바바리안 4",
        "Barbarian League 5": "바바리안 5",
        "Barbarian League 6": "바바리안 6",
        "Archer League 7": "아처 7",
        "Archer League 8": "아처 8",
        "Archer League 9": "아처 9",
        "Wizard League 10": "마법사 10",
        "Wizard League 11": "마법사 11",
        "Wizard League 12": "마법사 12",
        "Valkyrie League 13": "발키리 13",
        "Valkyrie League 14": "발키리 14",
        "Valkyrie League 15": "발키리 15",
        "Witch League 16": "마녀 16",
        "Witch League 17": "마녀 17",
        "Witch League 18": "마녀 18",
        "Golem League 19": "골렘 19",
        "Golem League 20": "골렘 20",
        "Golem League 21": "골렘 21",
        "P.E.K.K.A League 22": "페카 22",
        "P.E.K.K.A League 23": "페카 23",
        "P.E.K.K.A League 24": "페카 24",
        "Titan League 25": "타이탄 25",
        "Titan League 26": "타이탄 26",
        "Titan League 27": "타이탄 27",
        "Dragon League 28": "드래곤 28",
        "Dragon League 29": "드래곤 29",
        "Dragon League 30": "드래곤 30",
        "Electro League 31": "일렉트로 31",
        "Electro League 32": "일렉트로 32",
        "Electro League 33": "일렉트로 33",
        "Legend League": "전설"
    };
    return leagues[league] || league;
}

// 에러 표시
function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

// 로딩 숨김
function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// 모든 플레이어 정보를 로드
async function loadAllPlayers() {
    const container = document.getElementById('players-container');

    // 🧩 ranking.html 에서는 players-container가 없음 → 그냥 데이터만 불러오고 끝
    if (!container) {
        console.warn('players-container가 없어, 랭킹 페이지 모드로 동작 중.');
    }

    try {
        // 백엔드 API에서 플레이어 정보 가져오기
        const response = await fetch('/api/players');

        if (!response.ok) {
            throw new Error(`API 요청에 실패했습니다 (${response.status})`);
        }

        const data = await response.json();
        const players = data.players;
        console.log('API에서 가져온 플레이어 데이터:', players); // API 응답 데이터 확인
        
        // 전역으로 플레이어 데이터 저장 (선택 사항)
        window.PLAYERS = players;

        hideLoading();

        // ✅ index.html일 때만 append
        if (container) {
            players.forEach((player, index) => {
                const card = createPlayerCard(player, index);
                container.appendChild(card);
            });
        }

    } catch (error) {
        hideLoading();
        showError(`오류가 발생했습니다: ${error.message}`);
        console.error('Error:', error);
    }
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', loadAllPlayers);
