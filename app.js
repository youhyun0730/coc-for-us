// 英雄の装備を取得
function getEquipmentForHero(heroName, allEquipment) {
    const normalizedHeroName = heroNameMapping[heroName] || heroName;
    const heroEquipmentNames = heroEquipmentMapping[normalizedHeroName] || [];

    return allEquipment.filter(equipment => {
        const normalizedEquipmentName = equipmentNameMapping[equipment.name] || equipment.name;
        return heroEquipmentNames.includes(normalizedEquipmentName);
    });
}

// 영웅 섹션 생성
function createHeroesSection(player) {
    if (!player.heroes || player.heroes.length === 0) {
        return '';
    }

    // Battle MachineとBattle Copterを除外
    const filteredHeroes = player.heroes.filter(hero => {
        const heroName = hero.name.toLowerCase();
        return !heroName.includes('battle machine') &&
               !heroName.includes('battle copter') &&
               !heroName.includes('배틀 머신') &&
               !heroName.includes('배틀 콥터');
    });

    if (filteredHeroes.length === 0) {
        return '';
    }

    const heroesHTML = filteredHeroes.map((hero, index) => {
        const heroId = `hero-${player.tag.replace('#', '')}-${index}`;
        const heroEquipment = getEquipmentForHero(hero.name, player.heroEquipment || []);

        const equipmentHTML = heroEquipment.length > 0
            ? heroEquipment.map(eq => `
                <div class="equipment-item-small">
                    <span class="equipment-name">${translateEquipmentName(eq.name)}</span>
                    <span class="equipment-level">레벨 ${eq.level}</span>
                </div>
            `).join('')
            : '<div class="no-equipment">装備なし</div>';

        return `
            <div class="hero-item ${heroEquipment.length > 0 ? 'has-equipment' : ''}" onclick="toggleHeroEquipment('${heroId}')">
                <div class="hero-main">
                    <span class="hero-name">${translateHeroName(hero.name)}</span>
                    <span class="hero-level">레벨 ${hero.level}</span>
                    ${heroEquipment.length > 0 ? `<span class="hero-toggle" id="toggle-${heroId}">▼</span>` : ''}
                </div>
                ${heroEquipment.length > 0 ? `
                    <div class="hero-equipment-list" id="${heroId}" style="display: none;">
                        ${equipmentHTML}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');

    return `
        <div class="heroes-section">
            <div class="section-title">영웅</div>
            <div class="heroes-list">
                ${heroesHTML}
            </div>
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
        'Invisible Vial': '투명 마법 병',
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
        'Meteor Staff': '메테오 스태프'
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

    const clanInfo = player.clan
        ? `<div class="clan-info">
               <div class="clan-name">${player.clan.name}</div>
               <div class="info-row">
                   <span class="info-label">클랜 직책</span>
                   <span class="info-value">${translateRole(player.role)}</span>
               </div>
           </div>`
        : `<div class="clan-info">
               <div class="no-clan">클랜 미소속</div>
           </div>`;

    // 경쟁전 정보 HTML
    const competitiveInfo = `
        <div class="competitive-info" id="competitive-${player.tag.replace('#', '')}" style="display: none;">
            <div>경쟁전 정보 api 준비중...</div>
        </div>
    `;

    card.innerHTML = `
        <div class="player-header">
            <div class="player-rank">#${index + 1}</div>
            <div class="player-name">${player.name}</div>
            <div class="player-tag">${player.tag}</div>
        </div>

        <div class="player-info">

            <div class="info-row town-hall town-hall-level-${player.townHallLevel}">
                <span class="info-label">타운홀</span>
                <span class="info-value">${player.townHallLevel}</span>
            </div>

            <div class="info-row hero-total">
                <span class="info-label">영웅합</span>
                <span class="info-value">${totalHeroLevels}</span>
            </div>

            <div class="info-row trophies">
                <span class="info-label">${translateLeague(player.leagueTier.name)}</span>
                <span class="info-value">${player.trophies.toLocaleString()}</span>
            </div>

            <div class="info-row experience-level">
                <span class="info-label">경험치 레벨</span>
                <span class="info-value">${player.expLevel}</span>
            </div>

        </div>

        ${createHeroesSection(player)}

        ${clanInfo}

        <button class="toggle-competitive-btn" onclick="toggleCompetitiveInfo('${player.tag.replace('#', '')}')">
            경쟁전 정보 보기 ▼
        </button>

        ${competitiveInfo}
    `;

    return card;
}

function toggleCompetitiveInfo(playerTag) {
    const competitiveInfo = document.getElementById(`competitive-${playerTag}`);
    const toggleButton = document.querySelector(`button[onclick="toggleCompetitiveInfo('${playerTag}')"]`);

    if (competitiveInfo.style.display === 'none') {
        competitiveInfo.style.display = 'block';
        toggleButton.textContent = '경쟁전 정보 숨기기 ▲';
    } else {
        competitiveInfo.style.display = 'none';
        toggleButton.textContent = '경쟁전 정보 보기 ▼';
    }
}

// 직책을 한국어로 번역
function translateRole(role) {
    const roles = {
        'member': '멤버',
        'admin': '장로',
        'coLeader': '부리더',
        'leader': '리더'
    };
    return roles[role] || role;
}

// 경쟁전 리그를 한국어로 번역
function translateLeague(league) {
    const leagues = {
        'Unranked': '언랭크',
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
