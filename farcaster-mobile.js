// Game state
let spinsRemaining = 5;
const symbols = ['ARB', 'OP', 'ZORA'];
const symbolEmojis = { 'ARB': '🪙', 'OP': '💎', 'ZORA': '⚡' };

// DOM elements
let spinButton;
let resultMessage;
let spinsRemainingEl;
let slotCells;

// Initialize game
function initGame() {
  updateSpinsDisplay();
}

// Update spins display
function updateSpinsDisplay() {
  spinsRemainingEl.textContent = `${spinsRemaining} spins left`;
}

// Spin the slots
function spin() {
  if (spinsRemaining <= 0) {
    resultMessage.textContent = 'No spins left!';
    resultMessage.className = 'result-message lose';
    return;
  }

  spinsRemaining--;
  updateSpinsDisplay();
  
  // Add spinning animation
  slotCells.forEach(cell => {
    cell.classList.add('spinning');
  });

  // Generate random symbols
  setTimeout(() => {
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

    // Check for wins
    const win = checkWin(results);
    if (win) {
      resultMessage.textContent = `You won! ${win}`;
      resultMessage.className = 'result-message win';
    } else {
      resultMessage.textContent = 'Try again!';
      resultMessage.className = 'result-message lose';
    }

    slotCells.forEach(cell => {
      cell.classList.remove('spinning');
    });
  }, 500);
}

// Check for winning combinations
function checkWin(results) {
  // Simple win condition: 3 in a row
  const counts = {};
  results.forEach(symbol => {
    counts[symbol] = (counts[symbol] || 0) + 1;
  });
  
  for (const [symbol, count] of Object.entries(counts)) {
    if (count >= 3) {
      return `${count} ${symbol} tokens!`;
    }
  }
  return null;
}

// Screen management
function openScreen(screen) {
  document.getElementById(screen + 'Screen').classList.add('active');
}

function closeScreen(screen) {
  document.getElementById(screen + 'Screen').classList.remove('active');
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  spinButton = document.getElementById('spin-button');
  resultMessage = document.getElementById('result-message');
  spinsRemainingEl = document.getElementById('spins-remaining');
  slotCells = document.querySelectorAll('.slot-cell');

  initGame();
  spinButton.addEventListener('click', spin);
});
