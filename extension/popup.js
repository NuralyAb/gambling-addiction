// ── Load state ──

chrome.runtime.sendMessage({ type: 'GET_STATE' }, (state) => {
  if (!state) return;

  document.getElementById('toggleEnabled').checked = state.enabled;
  document.getElementById('statusText').textContent = state.enabled ? 'Активна' : 'Выключена';
  document.getElementById('todayCount').textContent = state.blockedToday || 0;
  document.getElementById('weekCount').textContent = state.blockedWeek || 0;
});

// ── Toggle blocking ──

document.getElementById('toggleEnabled').addEventListener('change', (e) => {
  const enabled = e.target.checked;
  document.getElementById('statusText').textContent = enabled ? 'Активна' : 'Выключена';
  chrome.runtime.sendMessage({ type: 'UPDATE_STATE', data: { enabled } });
});

// ── Open site ──

document.getElementById('btnSite').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'GET_STATE' }, (state) => {
    const url = state?.siteUrl || 'http://localhost:3000';
    chrome.tabs.create({ url: url + '/dashboard' });
    window.close();
  });
});

// ── SOS — open chat ──

document.getElementById('btnSOS').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'GET_STATE' }, (state) => {
    const url = state?.siteUrl || 'http://localhost:3000';
    chrome.tabs.create({ url: url + '/support' });
    window.close();
  });
});

// ── Open settings ──

document.getElementById('btnSettings').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
  window.close();
});
