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

  if (!enabled) {
    // Пытается выключить — показать модалку, уведомить доверенное лицо
    e.target.checked = true;
    const modal = document.getElementById('disableModal');
    modal.style.display = 'flex';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';

    chrome.runtime.sendMessage({ type: 'GET_STATE' }, (state) => {
      if (state?.apiToken && state?.siteUrl) {
        fetch(state.siteUrl + '/api/extension/disable-attempt', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + state.apiToken }
        }).catch(() => {});
      }
    });
    return;
  }

  document.getElementById('statusText').textContent = enabled ? 'Активна' : 'Выключена';
  chrome.runtime.sendMessage({ type: 'UPDATE_STATE', data: { enabled } });
});

document.getElementById('disableCancel').addEventListener('click', () => {
  const modal = document.getElementById('disableModal');
  modal.style.display = 'none';
  modal.style.visibility = 'hidden';
  document.getElementById('toggleEnabled').checked = true;
  document.getElementById('statusText').textContent = 'Активна';
});

document.getElementById('disableConfirm').addEventListener('click', () => {
  const modal = document.getElementById('disableModal');
  modal.style.display = 'none';
  modal.style.visibility = 'hidden';
  document.getElementById('statusText').textContent = 'Выключена';
  chrome.runtime.sendMessage({ type: 'UPDATE_STATE', data: { enabled: false } });
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
