const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const path = require('path');
require('dotenv').config();


const app = express();
app.use(cors());
app.use(express.json());

const RPC_URL = process.env.RPC_URL || "https://mainnet.base.org";   // or Base Sepolia for testing
const PRIVATE_KEY = process.env.PRIVATE_KEY;                         // fund this wallet
const DEFAULT_REWARD_ETH = process.env.DEFAULT_REWARD_ETH || "0.00001"; // 0.0001 ETH default
const PORT = process.env.PORT || 3001;

if (!PRIVATE_KEY) {
  console.error("❌ Missing PRIVATE_KEY in .env");
  process.exit(1);
}

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', message: 'Spin & Win API is running' });
});

// Simple anti-abuse: cap per-address payouts per hour (in-memory, replace with DB if needed)
const lastPaid = new Map(); // address => timestamp ms
const COOLDOWN_MS = 60 * 60 * 1000;

app.post('/api/spin', async (req, res) => {
  try {
    const { address, result } = req.body;

    if (!address || !result) {
      return res.status(400).json({ error: 'Missing required fields: address, result' });
    }
    if (!ethers.utils.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid address' });
    }

    if (result !== 'win') {
      return res.json({ success: false, message: 'No reward - try again!' });
    }

    const now = Date.now();
    const last = lastPaid.get(address) || 0;
    if (now - last < COOLDOWN_MS) {
      const mins = Math.ceil((COOLDOWN_MS - (now - last)) / 60000);
      return res.status(429).json({ error: `Cooldown active. Try again in ~${mins} min` });
    }

    // compute the prize (you can customize per symbol/row)
    const wei = ethers.utils.parseEther(String(DEFAULT_REWARD_ETH));

    const tx = await wallet.sendTransaction({
      to: address,
      value: wei
    });
    await tx.wait();

    lastPaid.set(address, now);

    res.json({
      success: true,
      txHash: tx.hash,
      amountEth: DEFAULT_REWARD_ETH
    });
  } catch (err) {
    console.error('Error processing payout:', err);
    res.status(500).json({ error: 'Failed to process payout', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Spin & Win API on :${PORT}`);
});
app.use(express.static(path.join(__dirname, '..'), { dotfiles: 'ignore' }));
app.get('/', (_req, res) =>
  res.sendFile(path.join(__dirname, '..', 'farcaster-mobile.html'))
);