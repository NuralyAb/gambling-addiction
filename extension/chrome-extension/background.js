const GAMBLING_DOMAINS = [
  "1xbet.com","1xbet.ru","1xstavka.ru",
  "bet365.com","bet365.es",
  "betway.com",
  "888casino.com","888poker.com","888sport.com",
  "pokerstars.com","pokerstars.eu","pokerstars.net",
  "williamhill.com","ladbrokes.com","bwin.com",
  "unibet.com","betfair.com","pinnacle.com",
  "marathonbet.com",
  "fonbet.com","fonbet.ru",
  "parimatch.com","parimatch.ru",
  "melbet.com","melbet.ru",
  "mostbet.com","mostbet.ru",
  "leonbets.com","leonbets.ru",
  "betboom.ru","ligastavok.ru","olimp.bet",
  "winline.ru","betcity.ru","baltbet.ru",
  "tennisi.com","zenit.win",
  "casino.com","casinox.com",
  "vulkan-vegas.com","vulkanvegas.com",
  "vulkan-casino.com","vulkan24.com",
  "joycasino.com","azino777.com","azino888.com",
  "slottica.com","fairspin.io",
  "stake.com","roobet.com","rollbit.com",
  "bcgame.com","bc.game","bitcasino.io","cloudbet.com",
  "partypoker.com","ggpoker.com","winamax.com","pokerdom.com",
  "slotoking.com","slotozal.com","igrovye-avtomaty.com",
  "slot-v.com","play-fortuna.com","playfortuna.com",
  "fresh-casino.com","pin-up.casino","pinup.ru",
  "vavada.com","cat-casino.com","sol-casino.com","jet-casino.com",
  "betsson.com","betclic.com","tipico.com","sbobet.com","dafabet.com",
  "stoloto.ru","lottery.com",
  "duelbits.com","gamdom.com","csgoempire.com","csgopolygon.com",
];

const API_BASE_URLS = [
  "http://localhost:3001",
  "http://localhost:3000",
];

async function getToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["sba_token"], (result) => {
      resolve(result.sba_token || null);
    });
  });
}

async function getApiBase() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["sba_api_base"], (result) => {
      resolve(result.sba_api_base || API_BASE_URLS[0]);
    });
  });
}

async function sendBlockEvent(domain, url) {
  const token = await getToken();
  if (!token) {
    console.log("[SafeBet] No token, skipping:", domain);
    return;
  }

  const base = await getApiBase();
  console.log("[SafeBet] Sending block event:", domain);

  for (const tryBase of [base, ...API_BASE_URLS.filter(b => b !== base)]) {
    try {
      const res = await fetch(tryBase + "/api/extension/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token,
          domain: domain,
          url: url || "",
          timestamp: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        console.log("[SafeBet] Event sent OK to", tryBase);
        if (tryBase !== base) {
          chrome.storage.local.set({ sba_api_base: tryBase });
        }
        return;
      }
      console.log("[SafeBet] Server responded:", res.status);
    } catch (err) {
      console.log("[SafeBet] Failed:", tryBase, err.message);
    }
  }
}

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch (e) {
    return null;
  }
}

function isGamblingDomain(hostname) {
  var domain = hostname.replace(/^www\./, "").toLowerCase();
  for (var i = 0; i < GAMBLING_DOMAINS.length; i++) {
    if (domain === GAMBLING_DOMAINS[i] || domain.endsWith("." + GAMBLING_DOMAINS[i])) {
      return true;
    }
  }
  return false;
}

async function updateBadge() {
  var result = await chrome.storage.local.get(["today_count", "today_date"]);
  var today = new Date().toISOString().slice(0, 10);
  var count = 0;
  if (result.today_date === today) {
    count = (result.today_count || 0) + 1;
  } else {
    count = 1;
  }
  await chrome.storage.local.set({ today_count: count, today_date: today });
  chrome.action.setBadgeText({ text: String(count) });
  chrome.action.setBadgeBackgroundColor({ color: "#EF4444" });
}

chrome.webNavigation.onBeforeNavigate.addListener(function(details) {
  if (details.frameId !== 0) return;
  var domain = extractDomain(details.url);
  if (domain && isGamblingDomain(domain)) {
    console.log("[SafeBet] BLOCKED navigation:", domain);
    sendBlockEvent(domain, details.url);
    updateBadge();
  }
});

chrome.webNavigation.onCommitted.addListener(function(details) {
  if (details.frameId !== 0) return;
  var domain = extractDomain(details.url);
  if (domain && isGamblingDomain(domain)) {
    console.log("[SafeBet] BLOCKED committed:", domain);
    sendBlockEvent(domain, details.url);
    updateBadge();
  }
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo) {
  if (changeInfo.url) {
    var domain = extractDomain(changeInfo.url);
    if (domain && isGamblingDomain(domain)) {
      console.log("[SafeBet] BLOCKED tab update:", domain);
      sendBlockEvent(domain, changeInfo.url);
      updateBadge();
    }
  }
});

chrome.runtime.onStartup.addListener(async function() {
  var result = await chrome.storage.local.get(["today_count", "today_date"]);
  var today = new Date().toISOString().slice(0, 10);
  if (result.today_date === today && result.today_count > 0) {
    chrome.action.setBadgeText({ text: String(result.today_count) });
    chrome.action.setBadgeBackgroundColor({ color: "#EF4444" });
  }
});

console.log("[SafeBet] Service worker loaded! Monitoring " + GAMBLING_DOMAINS.length + " domains");
