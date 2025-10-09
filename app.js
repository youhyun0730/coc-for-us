// プレイヤーカードを作成する関数
function createPlayerCard(player) {
    const card = document.createElement('div');
    card.className = 'player-card';

    const clanInfo = player.clan
        ? `<div class="clan-info">
               <div class="clan-name">${player.clan.name}</div>
               <div class="info-row">
                   <span class="info-label">クラン役職</span>
                   <span class="info-value">${translateRole(player.role)}</span>
               </div>
           </div>`
        : `<div class="clan-info">
               <div class="no-clan">クラン未所属</div>
           </div>`;

    card.innerHTML = `
        <div class="player-header">
            <div class="player-name">${player.name}</div>
        </div>
        <div class="player-tag">${player.tag}</div>

        <div class="player-info">
            <div class="info-row town-hall">
                <span class="info-label">タウンホール</span>
                <span class="info-value">レベル ${player.townHallLevel}</span>
            </div>

            <div class="info-row trophies">
                <span class="info-label">トロフィー</span>
                <span class="info-value">${player.trophies.toLocaleString()}</span>
            </div>

            <div class="info-row experience-level">
                <span class="info-label">経験値レベル</span>
                <span class="info-value">${player.expLevel}</span>
            </div>

            <div class="info-row">
                <span class="info-label">攻撃勝利数</span>
                <span class="info-value">${player.attackWins.toLocaleString()}</span>
            </div>

            <div class="info-row">
                <span class="info-label">防衛勝利数</span>
                <span class="info-value">${player.defenseWins.toLocaleString()}</span>
            </div>

            <div class="info-row">
                <span class="info-label">最高トロフィー</span>
                <span class="info-value">${player.bestTrophies.toLocaleString()}</span>
            </div>

            <div class="info-row">
                <span class="info-label">戦争スター数</span>
                <span class="info-value">${player.warStars.toLocaleString()}</span>
            </div>
        </div>

        ${clanInfo}
    `;

    return card;
}

// 役職を日本語に翻訳
function translateRole(role) {
    const roles = {
        'member': 'メンバー',
        'admin': '長老',
        'coLeader': '副リーダー',
        'leader': 'リーダー'
    };
    return roles[role] || role;
}

// エラー表示
function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

// ローディング非表示
function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// すべてのプレイヤー情報を読み込む
async function loadAllPlayers() {
    const container = document.getElementById('players-container');

    try {
        // バックエンドAPIからプレイヤー情報を取得
        const response = await fetch('/api/players');

        if (!response.ok) {
            throw new Error(`APIリクエストに失敗しました (${response.status})`);
        }

        const data = await response.json();
        const players = data.players;

        hideLoading();

        // プレイヤーカードを作成して表示
        players.forEach(player => {
            const card = createPlayerCard(player);
            container.appendChild(card);
        });

    } catch (error) {
        hideLoading();
        showError(`エラーが発生しました: ${error.message}`);
        console.error('Error:', error);
    }
}

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', loadAllPlayers);
