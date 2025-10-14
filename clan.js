// クラン詳細情報を表示するスクリプト

// 基本情報セクションを生成
function createBasicInfoSection(clan) {
    return `
        <div class="clan-basic-info">
            <div class="clan-header">
                <div class="clan-name-tag">
                    <div class="clan-name">${clan.name}</div>
                    <div class="clan-tag">${clan.tag}</div>
                </div>
                <img 
                    class="clan-league-icon" 
                    src="images/cwl/Icon_HV_CWL_${getWarLeagueNumber(clan.warLeague.name)}.png"
                    alt="${clan.warLeague.name}"
                    onerror="this.style.display='none';"
                />
            </div>

            <div class="info-grid">
                <div class="info-card level">
                    <div class="info-icon">🏆</div>
                    <div class="info-content">
                        <div class="info-level">클랜 레벨</div>
                        <div class="info-value">${clan.level || 'N/A'}</div>
                    </div>
                </div>

                <div class="info-card members">
                    <div class="info-icon">👥</div>
                    <div class="info-content">
                        <div class="info-label">클랜원 수</div>
                        <div class="info-value">${Array.isArray(clan.members) ? clan.members.length : (clan.members || 0)} / 50</div>
                    </div>
                </div>

                <div class="info-card capital">
                    <div class="info-icon">🏰</div>
                    <div class="info-content">
                        <div class="info-label">캐피탈 홀 레벨</div>
                        <div class="info-value">${clan.clanCapital?.capitalHallLevel || 'N/A'}</div>
                    </div>
                </div>

                <div class="info-card streak">
                    <div class="info-icon">🔥</div>
                    <div class="info-content">
                        <div class="info-label">클전 연속 승리</div>
                        <div class="info-value">${clan.warWinStreak || 0}</div>
                    </div>
                </div>
            </div>

            ${clan.description ? `
                <div class="clan-description">
                    <h3>클랜 소개</h3>
                    <p>${clan.description}</p>
                </div>
            ` : ''}
        </div>
    `;
}

//  clan.warleague를 입력하면 숫자로 출력하는 함수
function getWarLeagueNumber(warLeague) {
    const leagueMap = {
        'Unranked': 0,
        'Bronze League III': 1,
        'Bronze League II': 2,
        'Bronze League I': 3,
        'Silver League III': 4,
        'Silver League II': 5,
        'Silver League I': 6,
        'Gold League III': 7,
        'Gold League II': 8,
        'Gold League I': 9,
        'Crystal League III': 10,
        'Crystal League II': 11,
        'Crystal League I': 12,
        'Master League III': 13,
        'Master League II': 14,
        'Master League I': 15,
        'Champion League III': 16,
        'Champion League II': 17,
        'Champion League I': 18
    };
    return leagueMap[warLeague] || 0;
}


// 상세 정보 섹션을 生成
function createDetailedInfoSection(clan) {
    const clanTagId = clan.tag.replace('#', '');
    return `
        <div class="detailed-info-section">
            <button class="toggle-details-btn" onclick="toggleDetails('${clanTagId}')">
                <span id="toggle-text-${clanTagId}">상세 정보 보기</span>
                <span id="toggle-icon-${clanTagId}">▼</span>
            </button>

            <div id="detailed-info-${clanTagId}" class="detailed-info" style="display: none;">
                <div class="detail-grid">

                    <!-- 전쟁 기록 -->
                    <div class="detail-card">
                        <h3>전쟁 기록</h3>
                        <div class="detail-items">
                            <div class="detail-item">
                                <span class="detail-label">승리</span>
                                <span class="detail-value wins">${clan.warWins || 0}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">무승부</span>
                                <span class="detail-value">${clan.warTies || 0}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">패배</span>
                                <span class="detail-value losses">${clan.warLosses || 0}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">승률</span>
                                <span class="detail-value">${calculateWinRate(clan)}%</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">전쟁 빈도</span>
                                <span class="detail-value">${translateWarFrequency(clan.warFrequency)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">클랜전 공개</span>
                                <span class="detail-value">${clan.isWarLogPublic ? '공개' : '비공개'}</span>
                            </div>
                        </div>
                    </div>

                    <!-- 캐피탈 정보 -->
                    ${clan.clanCapital ? `
                        <div class="detail-card">
                            <h3>클랜 캐피탈</h3>
                            <div class="detail-items">
                                <div class="detail-item">
                                    <span class="detail-label">캐피탈 홀 레벨</span>
                                    <span class="detail-value">${clan.clanCapital.capitalHallLevel}</span>
                                </div>
                                ${clan.clanCapital.districts ? `
                                    <div class="detail-item full-width">
                                        <span class="detail-label">지역</span>
                                        <div class="districts-list">
                                            ${clan.clanCapital.districts.map(d => `
                                                <div class="district-item">
                                                    <span>${d.name}</span>
                                                    <span>레벨 ${d.districtHallLevel}</span>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

// 승률 계산
function calculateWinRate(clan) {
    const total = (clan.warWins || 0) + (clan.warLosses || 0) + (clan.warTies || 0);
    if (total === 0) return 0;
    return ((clan.warWins || 0) / total * 100).toFixed(1);
}

// 전쟁 빈도 번역
function translateWarFrequency(frequency) {
    const frequencies = {
        'always': '항상',
        'moreThanOncePerWeek': '주 2회 이상',
        'oncePerWeek': '주 1회',
        'lessThanOncePerWeek': '주 1회 미만',
        'never': '안 함',
        'unknown': '알 수 없음'
    };
    return frequencies[frequency] || frequency;
}

// 클랜 타입 번역
function translateClanType(type) {
    const types = {
        'open': '누구나 참가',
        'inviteOnly': '초대 전용',
        'closed': '폐쇄'
    };
    return types[type] || type;
}

// 상세 정보 토글（각クランカードごとに動作）
function toggleDetails(clanTag) {
    const detailedInfo = document.getElementById(`detailed-info-${clanTag}`);
    const toggleText = document.getElementById(`toggle-text-${clanTag}`);
    const toggleIcon = document.getElementById(`toggle-icon-${clanTag}`);

    if (detailedInfo.style.display === 'none') {
        detailedInfo.style.display = 'block';
        toggleText.textContent = '상세 정보 숨기기';
        toggleIcon.textContent = '▲';
    } else {
        detailedInfo.style.display = 'none';
        toggleText.textContent = '상세 정보 보기';
        toggleIcon.textContent = '▼';
    }
}

// 클랜 카드를 생成
function createClanCard(clan) {
    return `
        <div class="clan-card">
            ${createBasicInfoSection(clan)}
            ${createDetailedInfoSection(clan)}
        </div>
    `;
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

// すべてのクラン情報をロード
async function loadAllClans() {
    const container = document.getElementById('clan-container');

    try {
        // 백엔드 API에서 클랜 정보 가져오기
        const response = await fetch('/api/clan');

        if (!response.ok) {
            throw new Error(`API 요청에 실패했습니다 (${response.status})`);
        }

        const data = await response.json();
        const clans = data.clans;
        console.log('API에서 가져온 플레이어 데이터:', clans); // 디버그용 로그

        hideLoading();

        // 클랜 카드를 생성하고 표시
        clans.forEach(clan => {
            const cardHTML = createClanCard(clan);
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = cardHTML;
            container.appendChild(tempDiv.firstElementChild);
        });

    } catch (error) {
        hideLoading();
        showError(`오류가 발생했습니다: ${error.message}`);
        console.error('Error:', error);
    }
}

// 페이지 로드 시 実行
document.addEventListener('DOMContentLoaded', loadAllClans);
