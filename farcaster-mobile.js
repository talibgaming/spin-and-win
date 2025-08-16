// --- config ---
const API_BASE = ""; // same-origin. if you need absolute: "https://<your-codespace>-3001.app.github.dev"
const DEFAULT_REWARD_LABEL = "Reward sent!"; // text to show after win

// Game state
let spinsRemaining = 5;
const symbols = ['ARB', 'OP', 'ZORA'];
const symbolEmojis = { 'ARB': '🪙', 'OP': '💎', 'ZORA': '⚡' };

// DOM elements
let spinButton;
let resultMessage;
let spinsRemainingEl;
let slotCells;
let userHandleEl;

// user payout address (from ?address=…, or injected wallet for local testing)
let userAddress = null;

// ---------- helpers ----------
function qs(name) {
  const m = new URLSearchParams(window.location.search).get(name);
  return m && m.trim() ? m.trim() : null;
}

async function detectAddress() {
  // 1) query param wins if present
  const fromQs = qs("address");
  if (fromQs) return fromQs;

  // 2) attempt injected wallet for local dev (NOT used in Farcaster Frames)
  try {
    if (window.ethereum && window.ethereum.request) {
      const accts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accts && accts[0]) return accts[0];
    }
  } catch (_) {}

  return null; // still null => you can show a prompt or disable payouts
}

function updateSpinsDisplay() {
  spinsRemainingEl.textContent = `${spinsRemaining} spins left`;
}

function checkWin(results) {
  // Simple: 3 in a row => win
  const counts = {};
  results.forEach(symbol => {
    counts[symbol] = (counts[symbol] || 0) + 1;
  });
  for (const [symbol, count] of Object.entries(counts)) {
    if (count >= 3) {
      return { won: true, detail: `${count} ${symbol} tokens!` };
    }
  }
  return { won: false, detail: null };
}

async function sendPayout(address) {
  // POST /api/spin with result="win"
  const res = await fetch(`${API_BASE}/api/spin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, result: "win" })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.details || `HTTP ${res.status}`);
  }
  return res.json();
}

// ---------- spin logic ----------
async function spin() {
  if (spinsRemaining <= 0) {
    resultMessage.textContent = 'No spins left!';
    resultMessage.className = 'result-message lose';
    return;
  }
  if (!userAddress) {
    resultMessage.textContent = 'Add ?address=0x... to the URL or connect wallet (local test).';
    resultMessage.className = 'result-message lose';
    return;
  }

  spinsRemaining--;
  updateSpinsDisplay();

  spinButton.disabled = true;
  resultMessage.textContent = 'Spinning…';
  resultMessage.className = 'result-message';

  // add spinning animation
  slotCells.forEach(cell => cell.classList.add('spinning'));

  setTimeout(async () => {
    // randomize symbols in UI
    const results = [];
    slotCells.forEach(cell => {
      const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
      const img = cell.querySelector('img');
      if (img) {
        img.src = `images/${randomSymbol.toLowerCase()}.png`;
        img.alt = randomSymbol;
      }
      cell.className = `slot-cell token-${randomSymbol.toLowerCase()}`;
      cell.dataset.symbol = randomSymbol;
      results.push(randomSymbol);
    });

    const { won, detail } = checkWin(results);

    if (!won) {
      resultMessage.textContent = 'Try again!';
      resultMessage.className = 'result-message lose';
      slotCells.forEach(cell => cell.classList.remove('spinning'));
      spinButton.disabled = false;
      return;
    }

    // won → call backend for payout
    try {
      resultMessage.textContent = 'You won! Sending reward…';
      resultMessage.className = 'result-message win';

      const data = await sendPayout(userAddress);
      const txHash = data?.txHash ? data.txHash : null;

      resultMessage.textContent = txHash
        ? `🎉 ${DEFAULT_REWARD_LABEL} Tx: ${txHash.slice(0,6)}…${txHash.slice(-4)}`
        : `🎉 ${DEFAULT_REWARD_LABEL}`;
      resultMessage.className = 'result-message win';
    } catch (err) {
      resultMessage.textContent = `Payout failed: ${err.message}`;
      resultMessage.className = 'result-message lose';
    } finally {
      slotCells.forEach(cell => cell.classList.remove('spinning'));
      spinButton.disabled = false;
    }
  }, 500);
}

// ---------- wiring ----------
async function detectAndShowAddress() {
  userAddress = await detectAddress();
  if (userAddress && userHandleEl) {
    userHandleEl.textContent = `@${(qs("user") || "player")} • ${userAddress.slice(0,6)}…${userAddress.slice(-4)}`;
  } else if (userHandleEl) {
    userHandleEl.textContent = "Connect wallet";
  }
}

document.addEventListener('DOMContentLoaded', async function() {
  spinButton = document.getElementById('spin-button');
  resultMessage = document.getElementById('result-message');
  spinsRemainingEl = document.getElementById('spins-remaining');
  slotCells = document.querySelectorAll('.slot-cell');
  userHandleEl = document.getElementById('user-handle');

  await detectAndShowAddress();

  updateSpinsDisplay();
  spinButton.addEventListener('click', async () => {
    // Try to detect address again before spinning
    if (!userAddress) {
      await detectAndShowAddress();
    }
    await spin();
  });
});
