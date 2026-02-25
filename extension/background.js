// ── Gambling domains database ──

const BASE_DOMAINS = [
  '1xbet', '1win', 'melbet', 'pinup', 'pin-up', 'mostbet', 'parimatch',
  'fonbet', 'olimpbet', 'winline', 'betcity', 'pokerdom', 'pokerstars',
  'ggpoker', 'vavada', 'vulkan', 'vulkanvegas', 'vulkanbet',
  'leonbets', 'betboom', 'liga-stavok', 'ligastavok', 'marathonbet',
  'bwin', 'bet365', '888casino', '888poker', 'betwinner', 'betway',
  'casinox', 'joycasino', 'azino777', 'azino', 'stake',
  'rollbit', 'roobet', 'csgofast', 'gamdom', 'duelbits'
];

const ZONES = ['.com', '.ru', '.kz', '.net', '.org', '.io', '.bet', '.casino', '.de', '.es', '.pt', '.by'];

// Generate full domain list
function generateDomainList() {
  const domains = new Set();
  for (const base of BASE_DOMAINS) {
    for (const zone of ZONES) {
      domains.add(base + zone);
      domains.add('www.' + base + zone);
    }
  }
  return domains;
}

const BLOCKED_DOMAINS = generateDomainList();

// ── State ──

const DEFAULT_STATE = {
  enabled: true,
  strictMode: false,
  strictPassword: '',
  customDomains: [],
  whitelist: [],
  blockedToday: 0,
  blockedWeek: 0,
  todayDate: new Date().toISOString().slice(0, 10),
  weekStart: getWeekStart(),
  apiToken: '',
  siteUrl: 'http://localhost:3000'
};

function getWeekStart() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + 1); // Monday
  return d.toISOString().slice(0, 10);
}

async function getState() {
  const result = await chrome.storage.local.get('state');
  const state = { ...DEFAULT_STATE, ...result.state };

  // Reset daily counter
  const today = new Date().toISOString().slice(0, 10);
  if (state.todayDate !== today) {
    state.blockedToday = 0;
    state.todayDate = today;
  }

  // Reset weekly counter
  const weekStart = getWeekStart();
  if (state.weekStart !== weekStart) {
    state.blockedWeek = 0;
    state.weekStart = weekStart;
  }

  return state;
}

async function saveState(state) {
  await chrome.storage.local.set({ state });
}

// ── Domain matching ──

function isDomainBlocked(hostname, state) {
  const clean = hostname.replace(/^www\./, '').toLowerCase();

  // Check whitelist first
  if (state.whitelist.some(d => clean === d || clean.endsWith('.' + d))) {
    return false;
  }

  // Check hardcoded domains
  if (BLOCKED_DOMAINS.has(hostname.toLowerCase()) || BLOCKED_DOMAINS.has(clean)) {
    return true;
  }

  // Check if any base domain is a substring
  for (const base of BASE_DOMAINS) {
    if (clean.includes(base)) return true;
  }

  // Check custom domains
  if (state.customDomains.some(d => clean === d || clean.endsWith('.' + d))) {
    return true;
  }

  return false;
}

// ── Navigation listener ──

chrome.webNavigation?.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return; // Only main frame

  const state = await getState();
  if (!state.enabled) return;

  let url;
  try {
    url = new URL(details.url);
  } catch {
    return;
  }

  if (isDomainBlocked(url.hostname, state)) {
    // Increment counters
    state.blockedToday++;
    state.blockedWeek++;
    await saveState(state);

    // Redirect to block page
    const blockedUrl = chrome.runtime.getURL('blocked.html') +
      '?url=' + encodeURIComponent(details.url) +
      '&strict=' + (state.strictMode ? '1' : '0');

    chrome.tabs.update(details.tabId, { url: blockedUrl });

    // Sync with site
    syncBlockEvent(state, url.hostname);
  }
});

// Also intercept via onCommitted as a fallback
chrome.webNavigation?.onCommitted.addListener(async (details) => {
  if (details.frameId !== 0) return;

  const state = await getState();
  if (!state.enabled) return;

  let url;
  try {
    url = new URL(details.url);
  } catch {
    return;
  }

  // Don't block the block page itself
  if (details.url.startsWith(chrome.runtime.getURL(''))) return;

  if (isDomainBlocked(url.hostname, state)) {
    const blockedUrl = chrome.runtime.getURL('blocked.html') +
      '?url=' + encodeURIComponent(details.url) +
      '&strict=' + (state.strictMode ? '1' : '0');

    chrome.tabs.update(details.tabId, { url: blockedUrl });
  }
});

// ── Sync with site API ──

async function syncBlockEvent(state, domain) {
  if (!state.apiToken) return;

  try {
    await fetch(state.siteUrl + '/api/extension/block-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + state.apiToken
      },
      body: JSON.stringify({
        domain,
        timestamp: new Date().toISOString(),
        blockedToday: state.blockedToday,
        blockedWeek: state.blockedWeek
      })
    });
  } catch {
    // Silent fail — site may be offline
  }
}

// ── Message handler for popup/settings ──

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_STATE') {
    getState().then(sendResponse);
    return true;
  }

  if (msg.type === 'UPDATE_STATE') {
    getState().then(state => {
      const updated = { ...state, ...msg.data };
      saveState(updated).then(() => sendResponse(updated));
    });
    return true;
  }

  if (msg.type === 'CHECK_STRICT_PASSWORD') {
    getState().then(state => {
      sendResponse({ valid: state.strictPassword === msg.password });
    });
    return true;
  }

  if (msg.type === 'ALLOW_ONCE') {
    // Temporarily allow a domain for 5 minutes
    getState().then(state => {
      const domain = msg.domain;
      state.whitelist.push(domain);
      saveState(state).then(() => {
        sendResponse({ ok: true });
        // Remove from whitelist after 5 minutes
        setTimeout(async () => {
          const s = await getState();
          s.whitelist = s.whitelist.filter(d => d !== domain);
          saveState(s);
        }, 5 * 60 * 1000);
      });
    });
    return true;
  }
});

// ── Daily reset alarm ──

chrome.alarms.create('dailyReset', { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'dailyReset') {
    await getState(); // This auto-resets counters if date changed
  }
});

console.log('NoBet extension loaded. Blocking', BLOCKED_DOMAINS.size, 'domains.');
