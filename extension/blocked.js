// ── Parse URL params ──

const params = new URLSearchParams(window.location.search);
const blockedUrl = params.get('url') || '';
const isStrict = params.get('strict') === '1';

// Show blocked domain
try {
  const domain = new URL(blockedUrl).hostname;
  document.getElementById('blockedDomain').textContent = domain;
} catch {
  document.getElementById('blockedDomain').textContent = '';
}

// ── Timer ──

const TIMER_DURATION = 60;
let timeLeft = TIMER_DURATION;
const circumference = 2 * Math.PI * 54; // r=54

const timerProgress = document.getElementById('timerProgress');
const timerText = document.getElementById('timerText');
const actionsEl = document.getElementById('actions');

timerProgress.style.strokeDasharray = circumference;
timerProgress.style.strokeDashoffset = '0';

const interval = setInterval(() => {
  timeLeft--;
  timerText.textContent = timeLeft;

  // Update circle progress
  const offset = circumference * (1 - timeLeft / TIMER_DURATION);
  timerProgress.style.strokeDashoffset = offset;

  if (timeLeft <= 0) {
    clearInterval(interval);
    timerText.textContent = '0';
    showActions();
  }
}, 1000);

function showActions() {
  actionsEl.classList.add('visible');

  // In strict mode, hide "continue" button
  if (isStrict) {
    document.getElementById('btnContinue').style.display = 'none';
  }
}

// ── Button handlers ──

document.getElementById('btnBack').addEventListener('click', () => {
  // Go back or close tab
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.close();
  }
});

document.getElementById('btnChat').addEventListener('click', () => {
  // Get site URL from storage, fallback to localhost
  chrome.runtime.sendMessage({ type: 'GET_STATE' }, (state) => {
    const siteUrl = state?.siteUrl || 'http://localhost:3000';
    chrome.tabs.update({ url: siteUrl + '/support' });
  });
});

document.getElementById('btnContinue').addEventListener('click', () => {
  if (isStrict) {
    // Show password modal
    document.getElementById('passwordModal').classList.add('active');
    document.getElementById('passwordInput').focus();
  } else {
    // Allow once and redirect
    allowAndRedirect();
  }
});

// ── Password modal ──

document.getElementById('btnUnlock').addEventListener('click', () => {
  const password = document.getElementById('passwordInput').value;
  chrome.runtime.sendMessage({ type: 'CHECK_STRICT_PASSWORD', password }, (res) => {
    if (res?.valid) {
      document.getElementById('passwordModal').classList.remove('active');
      allowAndRedirect();
    } else {
      document.getElementById('passwordError').style.display = 'block';
      document.getElementById('passwordInput').value = '';
      document.getElementById('passwordInput').focus();
    }
  });
});

document.getElementById('btnCancelModal').addEventListener('click', () => {
  document.getElementById('passwordModal').classList.remove('active');
  document.getElementById('passwordError').style.display = 'none';
  document.getElementById('passwordInput').value = '';
});

// Enter key in password field
document.getElementById('passwordInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('btnUnlock').click();
  }
});

// ── Allow once ──

function allowAndRedirect() {
  if (!blockedUrl) {
    window.history.back();
    return;
  }

  try {
    const domain = new URL(blockedUrl).hostname.replace(/^www\./, '');
    chrome.runtime.sendMessage({ type: 'ALLOW_ONCE', domain }, () => {
      window.location.href = blockedUrl;
    });
  } catch {
    window.location.href = blockedUrl;
  }
}
