// ── State ──

let currentState = null;

function loadState() {
  chrome.runtime.sendMessage({ type: 'GET_STATE' }, (state) => {
    if (!state) return;
    currentState = state;
    renderAll();
  });
}

function updateState(data) {
  chrome.runtime.sendMessage({ type: 'UPDATE_STATE', data }, (state) => {
    currentState = state;
    renderAll();
  });
}

// ── Render ──

function renderAll() {
  renderDomainList('customDomainsList', currentState.customDomains || [], 'custom');
  renderDomainList('whitelistDomains', currentState.whitelist || [], 'whitelist');

  document.getElementById('toggleStrict').checked = currentState.strictMode;
  document.getElementById('strictPasswordSection').style.display =
    currentState.strictMode ? 'block' : 'none';

  document.getElementById('apiTokenInput').value = currentState.apiToken || '';
  document.getElementById('siteUrlInput').value = currentState.siteUrl || 'http://localhost:3000';
}

function renderDomainList(containerId, domains, type) {
  const container = document.getElementById(containerId);

  if (domains.length === 0) {
    container.innerHTML = '<div class="domain-empty">' +
      (type === 'custom' ? 'Нет добавленных доменов' : 'Нет исключений') +
      '</div>';
    return;
  }

  container.innerHTML = domains.map((domain, i) => `
    <div class="domain-item">
      <span>${domain}</span>
      <button class="remove" data-type="${type}" data-index="${i}">&times;</button>
    </div>
  `).join('');

  // Attach remove handlers
  container.querySelectorAll('.remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.dataset.type;
      const idx = parseInt(btn.dataset.index);
      if (t === 'custom') {
        const arr = [...(currentState.customDomains || [])];
        arr.splice(idx, 1);
        updateState({ customDomains: arr });
      } else {
        const arr = [...(currentState.whitelist || [])];
        arr.splice(idx, 1);
        updateState({ whitelist: arr });
      }
    });
  });
}

// ── Add custom domain ──

document.getElementById('btnAddCustom').addEventListener('click', () => {
  const input = document.getElementById('customDomainInput');
  const domain = input.value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!domain) return;

  const arr = [...(currentState.customDomains || [])];
  if (!arr.includes(domain)) {
    arr.push(domain);
    updateState({ customDomains: arr });
  }
  input.value = '';
});

document.getElementById('customDomainInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('btnAddCustom').click();
});

// ── Add whitelist domain ──

document.getElementById('btnAddWhitelist').addEventListener('click', () => {
  const input = document.getElementById('whitelistInput');
  const domain = input.value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!domain) return;

  const arr = [...(currentState.whitelist || [])];
  if (!arr.includes(domain)) {
    arr.push(domain);
    updateState({ whitelist: arr });
  }
  input.value = '';
});

document.getElementById('whitelistInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('btnAddWhitelist').click();
});

// ── Strict mode ──

document.getElementById('toggleStrict').addEventListener('change', (e) => {
  const strictMode = e.target.checked;
  document.getElementById('strictPasswordSection').style.display = strictMode ? 'block' : 'none';
  updateState({ strictMode });
});

document.getElementById('btnSavePassword').addEventListener('click', () => {
  const password = document.getElementById('strictPasswordInput').value;
  if (!password) return;

  updateState({ strictPassword: password });
  document.getElementById('strictPasswordInput').value = '';
  const status = document.getElementById('passwordStatus');
  status.textContent = 'Пароль сохранён';
  status.style.display = 'block';
  setTimeout(() => { status.style.display = 'none'; }, 2000);
});

// ── API Token ──

document.getElementById('btnSaveToken').addEventListener('click', () => {
  const apiToken = document.getElementById('apiTokenInput').value.trim();
  const siteUrl = document.getElementById('siteUrlInput').value.trim() || 'http://localhost:3000';

  updateState({ apiToken, siteUrl });
  const status = document.getElementById('tokenStatus');
  status.textContent = 'Настройки сохранены';
  status.style.display = 'block';
  setTimeout(() => { status.style.display = 'none'; }, 2000);
});

// ── Reset stats ──

document.getElementById('btnResetStats').addEventListener('click', () => {
  if (confirm('Сбросить всю статистику блокировок?')) {
    updateState({ blockedToday: 0, blockedWeek: 0 });
  }
});

// ── Init ──

loadState();
