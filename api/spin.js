import { ethers } from 'ethers';
import { sendEth, sendErc20 } from './_utils';

const DEFAULT_REWARD_ETH = process.env.DEFAULT_REWARD_ETH || "0.0001";
const TOKENS = {           // put verified Base token addresses here
  ZORA: process.env.ZORA_TOKEN_ADDR || "",
  OP:   process.env.OP_TOKEN_ADDR   || "",
  ARB:  process.env.ARB_TOKEN_ADDR  || ""
};
const DEFAULTS = {
  ZORA: process.env.ZORA_REWARD_AMOUNT || "5",
  OP:   process.env.OP_REWARD_AMOUNT   || "1",
  ARB:  process.env.ARB_REWARD_AMOUNT  || "1"
};

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');
    const { address, result, tokenSymbol, tokenAmount } = req.body || {};
    if (!address || !ethers.utils.isAddress(address)) return res.status(400).json({ error: 'Invalid address' });
    if (result !== 'win') return res.json({ success:false, message:'No reward' });

    let txHash, mode;
    if (tokenSymbol && TOKENS[tokenSymbol]) {
      const amt = tokenAmount || DEFAULTS[tokenSymbol];
      txHash = await sendErc20(TOKENS[tokenSymbol], address, amt);
      mode = `ERC20:${tokenSymbol}`;
    } else {
      txHash = await sendEth(address, DEFAULT_REWARD_ETH);
      mode = 'ETH';
    }
    res.json({ success:true, mode, txHash });
  } catch (e) {
    res.status(500).json({ error:'Payout failed', details:e.message });
  }
}
