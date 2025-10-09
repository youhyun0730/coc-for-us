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
                    <span class="equipment-name">${eq.name}</span>
                    <span class="equipment-level">레벨 ${eq.level}</span>
                </div>
            `).join('')
            : '<div class="no-equipment">装備なし</div>';

        return `
            <div class="hero-item ${heroEquipment.length > 0 ? 'has-equipment' : ''}" onclick="toggleHeroEquipment('${heroId}')">
                <div class="hero-main">
                    <span class="hero-name">${hero.name}</span>
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
function createPlayerCard(player) {
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

    card.innerHTML = `
        <div class="player-header">
            <div class="player-name">${player.name}</div>
        </div>
        <div class="player-tag">${player.tag}</div>

        <div class="player-info">
            <div class="info-row town-hall">
                <span class="info-label">타운홀</span>
                <span class="info-value">레벨 ${player.townHallLevel}</span>
            </div>

            <div class="info-row trophies">
                <span class="info-label">트로피</span>
                <span class="info-value">${player.trophies.toLocaleString()}</span>
            </div>

            <div class="info-row experience-level">
                <span class="info-label">경험치 레벨</span>
                <span class="info-value">${player.expLevel}</span>
            </div>

            <div class="info-row hero-total">
                <span class="info-label">영웅합</span>
                <span class="info-value">${totalHeroLevels}</span>
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
        'coLeader': '부리더',
        'leader': '리더'
    };
    return roles[role] || role;
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

        hideLoading();

        // 플레이어 카드를 생성하고 표시
        players.forEach(player => {
            const card = createPlayerCard(player);
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
