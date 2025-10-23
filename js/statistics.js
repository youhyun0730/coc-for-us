// 📊 js/statistics.js (교체본)
window.addEventListener("load", async () => {
  const loading = document.getElementById("loading");
  const errorDiv = document.getElementById("error");

  try {
    const [playerRes, clanRes] = await Promise.all([
      fetch("/api/players"),
      fetch("/api/clan"), // ✅ 복수형 아님
    ]);

    if (!playerRes.ok || !clanRes.ok) {
      console.log("Players status:", playerRes.status, "Clans status:", clanRes.status);
      throw new Error("API 응답 오류");
    }

    const rawPlayers = await playerRes.json();
    const rawClans   = await clanRes.json();

    // ✅ 다양한 응답 포맷을 배열로 정규화
    const players = normalizePlayers(rawPlayers);
    const clans   = normalizeClans(rawClans);

    if (!Array.isArray(players) || !Array.isArray(clans)) {
      console.log("rawPlayers:", rawPlayers);
      console.log("rawClans:", rawClans);
      throw new Error("잘못된 데이터 형식");
    }

    loading.style.display = "none";

    // 통계 집계
    const townhallCounts  = countBy(players, "townHallLevel");
    const leagueCounts    = countByNested(players, "leagueTier", "name");
    const clanLevelCounts = countBy(clans,   "level");
    const warLeagueCounts = countByNested(clans, "warLeague", "name");

    // 차트 렌더
    renderChart("townhallChart",  "", townhallCounts);
    renderChart("leagueChart",    "", leagueCounts);
    renderChart("clanLevelChart", "",  clanLevelCounts);
    renderChart("warLeagueChart", "", warLeagueCounts);
  } catch (err) {
    console.error(err);
    loading.style.display = "none";
    errorDiv.style.display = "block";
    errorDiv.textContent = err.message || "데이터를 불러오는 중 오류가 발생했습니다.";
  }
});

/* ========== 정규화 유틸 ========== */
// /api/players 응답을 배열로 변환
function normalizePlayers(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.players)) return raw.players;
  if (Array.isArray(raw?.items))   return raw.items;
  if (Array.isArray(raw?.data))    return raw.data;

  // 객체 내부에 배열이 여러 개 있을 때 → 가장 큰 배열 사용
  if (raw && typeof raw === "object") {
    const arrays = Object.values(raw).filter(Array.isArray);
    if (arrays.length) {
      arrays.sort((a, b) => b.length - a.length);
      return arrays[0];
    }
  }
  return null;
}

// /api/clan 응답을 배열로 변환(단일 클랜 객체도 허용)
function normalizeClans(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.clans)) return raw.clans;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.data))  return raw.data;
  if (raw?.clan && typeof raw.clan === "object") return [raw.clan];
  if (raw && typeof raw === "object" && raw.name) return [raw]; // 단일 클랜
  return null;
}

/* ========== 집계 유틸 ========== */
function countBy(arr, key) {
  return arr.reduce((acc, obj) => {
    const k = obj?.[key];
    if (k != null) acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
}

function countByNested(arr, key, nestedKey) {
  return arr.reduce((acc, obj) => {
    const val = obj?.[key];
    const name = val && val[nestedKey] ? val[nestedKey] : "미배정";
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});
}

/* ========== Chart 렌더 (리그전·경쟁전은 원래 순서, 나머진 역순) ========== */
function renderChart(canvasId, label, dataObj) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  let labels = Object.keys(dataObj);
  let values = Object.values(dataObj);

  // ✅ 리그전 티어와 경쟁전 그래프만 순서 유지, 나머지는 역순
  if (!["warLeagueChart", "leagueChart"].includes(canvasId)) {
    labels = labels.reverse();
    values = values.reverse();
  }

   // ✅ 경쟁전 리그일 때 'Unranked'를 마지막으로 이동
  if (canvasId === "leagueChart" || label.includes("경쟁전")) {
    const idx = labels.findIndex(l => l.toLowerCase().includes("unranked"));
    if (idx !== -1) {
      const unrankedLabel = labels.splice(idx, 1)[0];
      const unrankedValue = values.splice(idx, 1)[0];
      labels.push(unrankedLabel);
      values.push(unrankedValue);
    }
  }

  new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label,
        data: values,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        borderColor: "rgba(0, 0, 0, 1)",
        borderWidth: 1.2,
        barThickness: 8,     // 얇고 세련된 막대
        borderRadius: 4,
        hoverBackgroundColor: "rgba(40, 40, 40, 0.9)",
        maxBarThickness: 12, // ✅ 너무 두꺼워지지 않게 제한
      }],
    },
    options: {
      indexAxis: "y", // ← 막대가 왼쪽에서 오른쪽으로
      responsive: true,
      maintainAspectRatio: false, // ✅ 항목 많을 때 그래프 잘리지 않게
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: label,
          color: "#111",
          font: { size: 16, weight: "bold" },
          padding: { top: 10, bottom: 10 },
        },
      },
      layout: { padding: { right: 10, left: 10 } },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { color: "#333", stepSize: 1 },
          grid: { drawBorder: false, color: "rgba(0,0,0,0.05)" },
        },
        y: {
          ticks: { color: "#333" },
          grid: { display: false },
        },
      },
    },
  });
}

// 탭 전환
document.querySelectorAll(".toggle-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".toggle-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((sec) => sec.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(btn.dataset.target).classList.add("active");
  });
});
