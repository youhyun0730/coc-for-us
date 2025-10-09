// 플레이어 카드를 생성하는 함수
function createPlayerCard(player) {
    const card = document.createElement('div');
    card.className = 'player-card';

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

            <div class="info-row">
                <span class="info-label">공격 승리</span>
                <span class="info-value">${player.attackWins.toLocaleString()}</span>
            </div>

            <div class="info-row">
                <span class="info-label">방어 승리</span>
                <span class="info-value">${player.defenseWins.toLocaleString()}</span>
            </div>

            <div class="info-row">
                <span class="info-label">최고 트로피</span>
                <span class="info-value">${player.bestTrophies.toLocaleString()}</span>
            </div>

            <div class="info-row">
                <span class="info-label">전쟁 스타</span>
                <span class="info-value">${player.warStars.toLocaleString()}</span>
            </div>
        </div>

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
