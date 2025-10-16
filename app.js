// 英雄の装備を取得
function getEquipmentForHero(heroName, allEquipment) {
    const normalizedHeroName = heroNameMapping[heroName] || heroName;
    const heroEquipmentNames = heroEquipmentMapping[normalizedHeroName] || [];

    return allEquipment.filter(equipment => {
        const normalizedEquipmentName = equipmentNameMapping[equipment.name] || equipment.name;
        return heroEquipmentNames.includes(normalizedEquipmentName);
    });
}

// 영웅 섹션 생성 (이미지 + 장비 정렬 + 토글 포함)
function createHeroesSection(player) {
  if (!player.heroes || player.heroes.length === 0) return '';

  // Battle Machine / Battle Copter 제외
  const filteredHeroes = player.heroes.filter(hero => {
    const n = (hero.name || '').toLowerCase();
    return !n.includes('battle machine') &&
           !n.includes('battle copter') &&
           !n.includes('배틀 머신') &&
           !n.includes('배틀 콥터');
  });
  if (filteredHeroes.length === 0) return '';

  const heroesHTML = filteredHeroes.map((hero, index) => {
    const heroId = `hero-${player.tag.replace('#', '')}-${index}`;
    const heroDisplayName = translateHeroName ? translateHeroName(hero.name) : hero.name;
    const heroImgSrc = getHeroImageSrc ? getHeroImageSrc(hero.name) : '';

    // ✅ ① 이 영웅이 가질 수 있는 "전체 장비 이름 목록" (정규화된 이름 기준)
    const normalizedHeroName = (typeof heroNameMapping !== 'undefined' && heroNameMapping[hero.name])
      ? heroNameMapping[hero.name]
      : hero.name;
    const allEquipmentNamesForHero =
      (typeof heroEquipmentMapping !== 'undefined' && heroEquipmentMapping[normalizedHeroName])
        ? heroEquipmentMapping[normalizedHeroName]
        : [];

    // ✅ ② 플레이어가 실제로 보유 중인 장비를 맵으로 (정규화된 이름 → 장비 객체)
    const ownedMap = new Map();
    const playerEquip = Array.isArray(player.heroEquipment) ? player.heroEquipment : [];
    playerEquip.forEach(eq => {
      const norm = (typeof equipmentNameMapping !== 'undefined' && equipmentNameMapping[eq.name])
        ? equipmentNameMapping[eq.name]
        : eq.name;
      ownedMap.set(norm, eq);
    });

    // ✅ ③ "전체 장비 목록"을 기준으로 렌더링 (보유/미보유 구분)
    const equipmentHTML = allEquipmentNamesForHero.length > 0
      ? allEquipmentNamesForHero.map(normName => {
          const owned = ownedMap.get(normName) || null;

          // 표기용 이름/이미지
          const displayName = translateEquipmentName ? translateEquipmentName(normName) : normName;
          const eqImgSrc = getEquipmentImageSrc ? getEquipmentImageSrc(normName, hero.name) : '';

          // 미보유면 이미지 흑백 + 레벨 "미보유"
          const imgStyle = owned ? '' : 'filter: grayscale(100%); opacity: .55;';
          const levelLabel = owned ? `레벨 ${owned.level}` : '미보유';

          return `
            <div class="equipment-item-small ${owned ? '' : 'missing'}">
              <div class="equipment-name">
                <img
                  class="equipment-image"
                  src="${eqImgSrc}"
                  alt="${displayName}"
                  loading="lazy"
                  onerror="this.style.display='none';"
                  style="${imgStyle}"
                />
                <span>${displayName}</span>
              </div>
              <span class="equipment-level">${levelLabel}</span>
            </div>
          `;
        }).join('')
      : '<div class="no-equipment">장비 없음</div>';

    // ✅ ④ 토글은 "이 영웅이 가질 수 있는 장비가 1개 이상"이면 활성화
    const hasEquipmentSlots = allEquipmentNamesForHero.length > 0;

    return `
      <div class="hero-item ${hasEquipmentSlots ? 'has-equipment' : ''}" ${hasEquipmentSlots ? `onclick="toggleHeroEquipment('${heroId}')"` : ''}>
        <div class="hero-main">
          <div class="hero-name">
            <img
              class="hero-image"
              src="${heroImgSrc}"
              alt="${heroDisplayName}"
              loading="lazy"
              onerror="this.style.display='none';"
            />
            <span>${heroDisplayName}</span>
          </div>
          <span class="hero-level">레벨 ${hero.level}</span>
          ${hasEquipmentSlots ? `<span class="hero-toggle" id="toggle-${heroId}" aria-controls="${heroId}">▼</span>` : ''}
        </div>
        ${hasEquipmentSlots ? `
          <div class="hero-equipment-list" id="${heroId}" style="display: none;">
            ${equipmentHTML}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  return `
    <div class="heroes-section">
      <div class="section-title">영웅 및 장비</div>
      <div class="heroes-list">
        ${heroesHTML}
      </div>
      <div class="total-hero-level">영웅합 : ${calculateTotalHeroLevels(player)}</div>
    </div>
  `;
}


// 英雄装備トグル機能
function toggleHeroEquipment(heroId) {
    const equipmentList = document.getElementById(heroId);
    const toggle = document.getElementById(`toggle-${heroId}`);

    if (equipmentList && toggle) {
        if (equipmentList.style.display === 'none') {
            equipmentList.style.display = 'block';
            toggle.textContent = '▲';
        } else {
            equipmentList.style.display = 'none';
            toggle.textContent = '▼';
        }
    }
}

//　英雄装備を韓国語で表示
function translateEquipmentName(name) {
    const equipmentTranslations = {
        'Barbarian Puppet': '바바리안 인형',
        'Rage Vial': '분노 마법 병',
        'Earthquake Boots': '지진 부츠',
        'Vampstache': '흡혈 수염',
        'Giant Gauntlet': '자이언트 건틀릿',
        'Spiky Ball': '스파이키 볼',
        'Snake Bracelet': '뱀 팔찌',

        'Archer Puppet': '아처 인형',
        'Invisibility Vial': '투명 마법 병',
        'Giant Arrow': '자이언트 화살',
        'Healer Puppet': '힐러 인형',
        'Frozen Arrow': '얼음 화살',
        'Magic Mirror': '마법 반사경',
        'Action Figure': '액션 피규어',

        'Eternal Tome': '영원의 책',
        'Life Gem': '생명의 보석',
        'Rage Gem': '분노의 보석',
        'Healing Tome': '치유의 책',
        'Fireball': '파이어볼',
        'Lavaloon Puppet': '라벌 인형',
        'Heroic Torch': '투지의 횃불',

        'Royal Gem': '로얄 보석',
        'Seeking Shield': '추적 방패',
        'Haste Vial': '신속 마법 병',
        'Hog Rider Puppet': '호그 라이더 인형',
        'Rocket Spear': '로켓 창',
        'Electro Boots': '일렉트로 부츠',

        'Henchmen Puppet': '보디가드 인형',
        'Dark Orb': '다크 오브',
        'Metal Pants': '메탈 바지',
        'Noble Iron': '노블 아이언',
        'Dark Crown': '다크 크라운',
        'Meteor Staff': '유성우 지팡이'
    };
    return equipmentTranslations[name] || name;
}

// 영웅 이름을 한국어로 번역
function translateHeroName(name) {
    const heroTranslations = {
        'Barbarian King': '바바리안 킹',
        'Archer Queen': '아처 퀸',
        'Grand Warden': '그랜드 워든',
        'Royal Champion': '로얄 챔피언',
        'Minion Prince': '미니언 프린스'
    };
    return heroTranslations[name] || name;
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

// 플레이어 카드를 생성하는 함수
function createPlayerCard(player, index) {
  const card = document.createElement('div');
  card.className = 'player-card';

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

  // ✅ 클랜 정보 박스 (배지 + 이름 + 직책)
  const clanInfo = player.clan
    ? `
      <div class="clan-info">
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
      <div class="clan-info">
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
            <span class="league-name">${translateLeague(player.leagueTier.name)}</span>
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

    ${clanInfo}

  `;

  return card;
}

// 직책을 한국어로 번역
function translateRole(role) {
    const roles = {
        'member': '멤버',
        'admin': '장로',
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

    try {
        // 백엔드 API에서 플레이어 정보 가져오기
        const response = await fetch('/api/players');

        if (!response.ok) {
            throw new Error(`API 요청에 실패했습니다 (${response.status})`);
        }

        const data = await response.json();
        const players = data.players;
        console.log('API에서 가져온 플레이어 데이터:', players); // API 응답 데이터 확인

        hideLoading();

        // 플레이어 카드를 생성하고 표시
        players.forEach((player, index) => {
            const card = createPlayerCard(player, index);
            container.appendChild(card);
        });

    } catch (error) {
        hideLoading();
        showError(`오류가 발생했습니다: ${error.message}`);
        console.error('Error:', error);
    }
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', loadAllPlayers);
