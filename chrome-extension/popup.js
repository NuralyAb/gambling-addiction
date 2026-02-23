const API_BASE_URLS = [
  "http://localhost:3001",
  "http://localhost:3000",
];

let apiBase = API_BASE_URLS[0];

async function init() {
  const result = await chrome.storage.local.get([
    "sba_token",
    "sba_api_base",
    "today_count",
    "today_date",
  ]);

  if (result.sba_api_base) {
    apiBase = result.sba_api_base;
  }

  document.getElementById("dashboardLink").href = `${apiBase}/extension`;

  if (result.sba_token) {
    await showConnected(result.sba_token);
    await loadStats(result.sba_token);
  } else {
    showDisconnected();
  }

  // Show today's local count
  const today = new Date().toISOString().slice(0, 10);
  if (result.today_date === today) {
    document.getElementById("todayCount").textContent = result.today_count || 0;
  }
}

async function showConnected(token) {
  document.getElementById("statusBar").className = "status-bar connected";
  document.getElementById("statusText").textContent = "Подключено";
  document.getElementById("connectSection").style.display = "none";
  document.getElementById("connectedSection").style.display = "block";
}

function showDisconnected() {
  document.getElementById("statusBar").className = "status-bar disconnected";
  document.getElementById("statusText").textContent = "Не подключено";
  document.getElementById("connectSection").style.display = "block";
  document.getElementById("connectedSection").style.display = "none";
}

function showMsg(id, text, type) {
  const el = document.getElementById(id);
  el.className = `msg ${type}`;
  el.textContent = text;
  setTimeout(() => { el.textContent = ""; el.className = ""; }, 4000);
}

async function loadStats(token) {
  try {
    const res = await fetch(`${apiBase}/api/extension/verify?token=${encodeURIComponent(token)}`);
    if (!res.ok) {
      showDisconnected();
      await chrome.storage.local.remove(["sba_token"]);
      showMsg("connectMsg", "Токен недействителен", "error");
      return;
    }
  } catch {
    // Server offline
  }
}

// Connect button
document.getElementById("connectBtn").addEventListener("click", async () => {
  const token = document.getElementById("tokenInput").value.trim();
  if (!token) {
    showMsg("connectMsg", "Введите токен", "error");
    return;
  }

  const btn = document.getElementById("connectBtn");
  btn.disabled = true;
  btn.textContent = "...";

  try {
    const res = await fetch(`${apiBase}/api/extension/verify?token=${encodeURIComponent(token)}`);

    if (!res.ok) {
      // Try alternate base
      for (const alt of API_BASE_URLS) {
        if (alt === apiBase) continue;
        try {
          const altRes = await fetch(`${alt}/api/extension/verify?token=${encodeURIComponent(token)}`);
          if (altRes.ok) {
            apiBase = alt;
            await chrome.storage.local.set({ sba_api_base: alt });
            await chrome.storage.local.set({ sba_token: token });
            showMsg("connectMsg", "Подключено!", "success");
            await showConnected(token);
            return;
          }
        } catch { /* continue */ }
      }
      showMsg("connectMsg", "Недействительный токен", "error");
      return;
    }

    await chrome.storage.local.set({ sba_token: token, sba_api_base: apiBase });
    showMsg("connectMsg", "Подключено!", "success");
    await showConnected(token);
  } catch {
    showMsg("connectMsg", "Сервер недоступен", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Подключить";
  }
});

// Disconnect button
document.getElementById("disconnectBtn").addEventListener("click", async () => {
  await chrome.storage.local.remove(["sba_token"]);
  showDisconnected();
});

init();
