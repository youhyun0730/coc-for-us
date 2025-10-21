// クラン詳細情報を表示するスクリプト

// クラン基本情報セクションを生成（최종 버전）
function createBasicInfoSection(clan) {
  const badgeUrl =
    clan?.badge?.url ||
    clan?.badgeUrls?.large ||
    clan?.badgeUrls?.medium ||
    clan?.badgeUrls?.small ||
    '';

  return `
    <div class="clan-basic-info">
      <div class="clan-header">

        <!-- 왼쪽: 배지 + 이름/태그 -->
        <div class="clan-name-tag">
          ${badgeUrl ? `
            <img
              class="clan-badge"
              src="${badgeUrl}"
              alt="${clan.name} badge"
              loading="lazy"
              decoding="async"
              onerror="this.style.display='none';"
            />
          ` : ''}
          <div class="clan-name-info">
            <div class="clan-name">${clan.name}</div>
            <div class="clan-tag">${clan.tag}</div>
          </div>
        </div>

        <!-- 오른쪽: 클랜원 수 -->
        <div class="clan-right">
          <div class="members-pill" title="클랜원" aria-label="클랜원 수">
            <span class="members-count">
              👥 ${getMemberCount(clan)} / ${getMemberLimit(clan)}
            </span>
          </div>
        </div>

      </div>
    </div>
  `;
}

function createLeagueSection(clan) {
  const tierName = clan.warLeague?.name || 'Unranked';
  const tierNum  = getWarLeagueNumber(tierName);
  const tierKo   = tLeague(tierName); // ✅ 한글 변환

  return `
    <section class="section league-section">
      <div class="section-title">리그전</div>
      <div class="league-body">
        <img class="cwl-icon"
             src="images/cwl/Icon_HV_CWL_${tierNum}.png"
             alt="${tierName}" onerror="this.style.display='none';" />
        <div class="league-meta">
          <div class="meta-value">${tierKo}</div> <!-- ✅ 한글로 바로 출력 -->
        </div>
      </div>
    </section>
  `;
}

function createWarSection(clan) {
  const wins   = clan.warWins   || 0;
  const ties   = clan.warTies   || 0;
  const losses = clan.warLosses || 0;
  const rate   = calculateWinRate(clan);
  const streak = clan.warWinStreak || 0;

  return `
    <section class="section war-section">
      <div class="section-title">클랜전</div>
      <div class="war-stats-grid">
        <div class="stat-card"><div class="stat-label">승리</div><div class="stat-value wins nowrap">${wins}</div></div>
        <div class="stat-card"><div class="stat-label">무승부</div><div class="stat-value nowrap">${ties}</div></div>
        <div class="stat-card"><div class="stat-label">패배</div><div class="stat-value losses nowrap">${losses}</div></div>
        <div class="stat-card"><div class="stat-label">승률</div><div class="stat-value nowrap">${rate}%</div></div>

        <!-- 연속 승리는 다음 줄(와이드 카드) -->
        <div class="stat-card wide">
          <div class="stat-label">연속 승리</div>
          <div class="stat-value streak">🔥 ${streak}</div>
        </div>
      </div>
    </section>
  `;
}

// 토글 헬퍼 (전역)
window.toggleCapital = function(id) {
  const box = document.getElementById(id);
  if (!box) return;
  box.classList.toggle('collapsed');
  // 토글 버튼 텍스트 스위치
  const btn = box.previousElementSibling?.querySelector('.capital-toggle-btn');
  if (btn) {
    const opened = !box.classList.contains('collapsed');
    btn.textContent = opened ? '접기' : '상세 정보';
  }
};

function createCapitalSection(clan) {
  const hall = clan.clanCapital?.capitalHallLevel;
  const districts = Array.isArray(clan.clanCapital?.districts) ? clan.clanCapital.districts : [];
  const safeId = `capital-details-${(clan.tag || '').replace(/[^A-Z0-9]/gi, '')}`;

  return `
    <section class="section capital-section">
      <div class="section-title">캐피탈</div>

      <div class="capital-header">
        ${hall ? `
          <img class="clan-capital-icon"
               src="images/capital-hall/Building_CC_Capital_Hall_level_${hall}.png"
               alt="Capital Hall Level ${hall}" onerror="this.style.display='none';" />
        ` : ''}
        <div class="capital-meta">
          <div class="meta-label">캐피탈 홀</div>
          <div class="meta-value">${hall ? `레벨 ${hall}` : '정보 없음'}</div>
        </div>

        <!-- 토글 버튼 -->
        <button type="button" class="capital-toggle-btn" onclick="toggleCapital('${safeId}')">
          ${districts.length ? '상세 정보' : '항목 없음'}
        </button>
      </div>

      ${districts.length ? `
        <div id="${safeId}" class="capital-details collapsed">
          <div class="districts-list">
            ${districts.map(d => `
              <div class="district-item">
                <span>${KO_CAPITAL_DISTRICTS[d.name] || d.name}</span>
                <span>레벨 ${d.districtHallLevel}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </section>
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

// 영→한 프리픽스 매핑
const LEAGUE_KO_PREFIX = {
  "Unranked": "언랭크",
  "Bronze League": "브론즈 리그",
  "Silver League": "실버 리그",
  "Gold League": "골드 리그",
  "Crystal League": "크리스탈 리그",
  "Master League": "마스터 리그",
  "Champion League": "챔피언 리그"
};

// "Master League II" → "마스터 II" 식으로 변환
function tLeague(en) {
  if (!en || typeof en !== 'string') return '언랭크';
  const key = Object.keys(LEAGUE_KO_PREFIX).find(k => en.startsWith(k));
  if (!key) return en; // 미정/예외값은 원문 유지
  const suffix = en.slice(key.length).trim(); // I, II, III 등
  return suffix ? `${LEAGUE_KO_PREFIX[key]} ${suffix}` : LEAGUE_KO_PREFIX[key];
}

// 멤버 수 안전 추출 (백엔드마다 키가 다를 수 있음)
function getMemberCount(clan) {
  if (Number.isFinite(clan?.members)) return clan.members;                 // 표준: members:number
  if (Number.isFinite(clan?.memberCount)) return clan.memberCount;         // 변형: memberCount
  if (Number.isFinite(clan?.membersCount)) return clan.membersCount;       // 변형: membersCount
  if (Number.isFinite(clan?.playerCount)) return clan.playerCount;         // 변형: playerCount
  if (Array.isArray(clan?.memberList)) return clan.memberList.length;      // 배열: memberList
  if (Array.isArray(clan?.membersList)) return clan.membersList.length;    // 배열: membersList
  if (Array.isArray(clan?.members)) return clan.members.length;            // 실수로 배열로 오는 경우
  return 0;
}

// 최대 인원(상한) 추출 (없으면 50)
function getMemberLimit(clan) {
  if (Number.isFinite(clan?.memberLimit)) return clan.memberLimit;         // 있으면 사용
  return 50;
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
                                                    <span>${tDistrict(d.name)}</span>
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

// ====== Capital / Districts 한글화 ======
const KO_CAPITAL_DISTRICTS = {
  'Capital Peak': '캐피탈 피크',
  'Barbarian Camp': '바바리안 집합소',
  'Wizard Valley': '마법사 계곡',
  'Balloon Lagoon': '비행선 석호',
  "Builder's Workshop": '장인의 작업장',
  'Dragon Cliffs': '드래곤 절벽',
  'Golem Quarry': '골렘 채석장',
  'Skeleton Park': '해골 공원',
  'Goblin Mines': '고블린 광산'
};

// 안전한 변환(미정 또는 신규 명칭이 오면 원문 유지)
function tDistrict(name) {
  if (!name || typeof name !== 'string') return name ?? '';
  return KO_CAPITAL_DISTRICTS[name] || name;
}

// 승률 계산
function calculateWinRate(clan) {
    const total = (clan.warWins || 0) + (clan.warLosses || 0);
    if (total === 0) return 0;
    return ((clan.warWins || 0) / total * 100).toFixed(1);
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
      ${createLeagueSection(clan)}
      ${createWarSection(clan)}
      ${createCapitalSection(clan)}
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
        console.log('API에서 가져온 클랜 데이터:', clans); // 디버그용 로그

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
