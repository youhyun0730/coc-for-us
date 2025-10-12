// 전설 및 경쟁전 플레이어 카드를 생성하는 함수
function createLegendPlayerCard(player, index) {
    const card = document.createElement('div');
    card.className = 'player-card';

    const leagueInfo = player.league
        ? `<div class="info-row league">
               <span class="info-label">리그</span>
               <span class="info-value">${player.league.name}</span>
           </div>`
        : `<div class="info-row league">
               <span class="info-label">리그</span>
               <span class="info-value">N/A</span>
           </div>`;

    const progressInfo = `
        <div class="info-row progress">
            <span class="info-label">공격 소모</span>
            <span class="info-value">${player.attacksUsed || 0} / ${player.totalAttacks || 8}</span>
        </div>
        <div class="info-row progress">
            <span class="info-label">완파</span>
            <span class="info-value">${player.starsEarned || 0} / ${player.totalStars || 3}</span>
        </div>
        <div class="info-row progress">
            <span class="info-label">방어 소모</span>
            <span class="info-value">${player.defensesUsed || 0} / ${player.totalDefenses || 8}</span>
        </div>
        <div class="info-row progress">
            <span class="info-label">방어 성공</span>
            <span class="info-value">${player.defensesWon || 0} / ${player.defensesUsed || 0}</span>
        </div>
    `;

    card.innerHTML = `
        <div class="player-header">
            <div class="player-rank">#${index + 1}</div>
            <div class="player-name">${player.name}</div>
            <div class="player-tag">${player.tag}</div>
        </div>

        <div class="player-info">
            ${leagueInfo}
            <div class="info-row trophies">
                <span class="info-label">현재 점수</span>
                <span class="info-value">${player.trophies.toLocaleString()}</span>
            </div>
            <div class="info-row rank">
                <span class="info-label">현재 등수</span>
                <span class="info-value">${player.rank || 'N/A'}</span>
            </div>
            ${progressInfo}
        </div>
    `;

    return card;
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

// 모든 전설 및 경쟁전 플레이어 정보를 로드
async function loadLegendPlayers() {
    const container = document.getElementById('legend-container');

    try {
        // 백엔드 API에서 전설 및 경쟁전 플레이어 정보 가져오기
        const response = await fetch('/api/legend');

        if (!response.ok) {
            throw new Error(`API 요청에 실패했습니다 (${response.status})`);
        }

        const data = await response.json();
        const players = data.legendPlayers;

        hideLoading();

        // 전설 및 경쟁전 플레이어 카드를 생성하고 표시
        players.forEach((player, index) => {
            const card = createLegendPlayerCard(player, index);
            container.appendChild(card);
        });

    } catch (error) {
        hideLoading();
        showError(`오류가 발생했습니다: ${error.message}`);
        console.error('Error:', error);
    }
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', loadLegendPlayers);